import React, { Suspense, lazy, useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import type { AnalysisResult, AppSettings, ProviderId, TranscriptionHistoryEntry } from './types';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  DEFAULT_SETTINGS,
  HISTORY_STORAGE_KEY,
  MAX_HISTORY_ITEMS,
  MAX_UPLOAD_SIZE_BYTES,
  SETTINGS_STORAGE_KEY,
  SYSTEM_INSTRUCTION,
} from './constants';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import InputPanel from './components/InputPanel';
import TranscriptionPanel from './components/TranscriptionPanel';
import AudioPanel from './components/AudioPanel';
import FooterControls from './components/FooterControls';

const SettingsModal = lazy(() => import('./components/SettingsModal'));

const GEMINI_ENV_KEY = process.env.GEMINI_API_KEY ?? '';
const GPT_ENV_KEY = process.env.OPENAI_API_KEY ?? '';

type SettingsTab = 'settings' | 'help';

function parseAnalysisResult(raw: string): AnalysisResult {
  let parsed: Partial<AnalysisResult>;
  try {
    parsed = JSON.parse(raw) as Partial<AnalysisResult>;
  } catch {
    parsed = JSON.parse(extractJsonObject(raw)) as Partial<AnalysisResult>;
  }

  if (!parsed.originalTranscript || !parsed.audioOptimizedTranscript) {
    throw new Error('Reponse JSON incomplete (originalTranscript/audioOptimizedTranscript requis).');
  }
  return {
    originalTranscript: parsed.originalTranscript,
    audioOptimizedTranscript: parsed.audioOptimizedTranscript,
  };
}

function extractJsonObject(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;

  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first >= 0 && last > first) {
    return trimmed.slice(first, last + 1);
  }

  throw new Error('Aucun JSON valide trouve dans la reponse.');
}

function getProviderLabel(provider: ProviderId | null): string {
  if (provider === 'gemini') return 'GEMINI';
  if (provider === 'gpt') return 'GPT';
  return 'AUCUN';
}

function getRemainingTokens(settings: AppSettings, provider: ProviderId): number {
  return provider === 'gemini' ? settings.geminiRemainingTokens : settings.gptRemainingTokens;
}

function updateRemainingTokens(settings: AppSettings, provider: ProviderId, consumed: number): AppSettings {
  if (provider === 'gemini') {
    return {
      ...settings,
      geminiRemainingTokens: Math.max(0, settings.geminiRemainingTokens - consumed),
    };
  }
  return {
    ...settings,
    gptRemainingTokens: Math.max(0, settings.gptRemainingTokens - consumed),
  };
}

function extractGeminiUsedTokens(response: any): number | null {
  const usage = response?.usageMetadata;
  const total = usage?.totalTokenCount;
  if (typeof total === 'number' && Number.isFinite(total)) return total;
  return null;
}

function estimatedFallbackTokens(result: AnalysisResult): number {
  const chars = result.originalTranscript.length + result.audioOptimizedTranscript.length;
  return Math.max(500, Math.ceil(chars / 3.7));
}

function effectiveApiKey(localKey: string, envKey: string): string {
  return localKey.trim() || envKey.trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isRetriableError(message: string): boolean {
  const msg = message.toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('500') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('timeout') ||
    msg.includes('tempor')
  );
}

async function withRetry<T>(operation: () => Promise<T>, label: string, maxAttempts = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const canRetry = attempt < maxAttempts && isRetriableError(message);
      if (!canRetry) {
        throw error;
      }

      const delay = 350 * 2 ** (attempt - 1);
      console.warn(`${label} tentative ${attempt} echouee, retry dans ${delay}ms`);
      await sleep(delay);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`${label} a echoue apres retries.`);
}

function buildProviderOrder(settings: AppSettings): ProviderId[] {
  if (settings.providerStrategy === 'gemini') {
    return settings.autoFallback ? ['gemini', 'gpt'] : ['gemini'];
  }

  if (settings.providerStrategy === 'gpt') {
    return settings.autoFallback ? ['gpt', 'gemini'] : ['gpt'];
  }

  const withBudget: Array<{ provider: ProviderId; remaining: number }> = [
    { provider: 'gemini' as const, remaining: settings.geminiRemainingTokens },
    { provider: 'gpt' as const, remaining: settings.gptRemainingTokens },
  ].sort((a, b) => b.remaining - a.remaining);

  return withBudget.map((entry) => entry.provider);
}

async function analyzeWithGeminiLocal(args: {
  apiKey: string;
  imageBase64: string;
  mimeType: string;
}): Promise<{ result: AnalysisResult; tokensUsed: number | null }> {
  const ai = new GoogleGenAI({ apiKey: args.apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro-preview-06-05',
    contents: {
      parts: [
        { text: 'Transpose et prepare cette page pour lecture audio selon tes instructions.' },
        { inlineData: { data: args.imageBase64, mimeType: args.mimeType } },
      ],
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          originalTranscript: {
            type: Type.STRING,
            description: "Le texte brut nettoye fidelement transcrit depuis l'image.",
          },
          audioOptimizedTranscript: {
            type: Type.STRING,
            description: 'La version optimisee pour la synthese vocale.',
          },
        },
        required: ['originalTranscript', 'audioOptimizedTranscript'],
      },
      temperature: 0.2,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Aucune reponse Gemini.');

  return {
    result: parseAnalysisResult(text),
    tokensUsed: extractGeminiUsedTokens(response),
  };
}

async function analyzeWithGptLocal(args: {
  apiKey: string;
  imageBase64: string;
  mimeType: string;
}): Promise<{ result: AnalysisResult; tokensUsed: number | null }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            `${SYSTEM_INSTRUCTION}\nReponds strictement en JSON avec originalTranscript et audioOptimizedTranscript.`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Transpose et prepare cette page pour lecture audio selon les instructions.' },
            {
              type: 'image_url',
              image_url: { url: `data:${args.mimeType};base64,${args.imageBase64}` },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenAI ${response.status}: ${details.slice(0, 200)}`);
  }

  const data = (await response.json()) as any;
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('Reponse GPT invalide ou vide.');
  }

  return {
    result: parseAnalysisResult(extractJsonObject(content)),
    tokensUsed: typeof data?.usage?.total_tokens === 'number' ? data.usage.total_tokens : null,
  };
}

async function analyzeWithPreprodBackend(args: {
  provider: ProviderId;
  imageBase64: string;
  mimeType: string;
}): Promise<{ result: AnalysisResult; tokensUsed: number | null }> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: args.provider,
      imageBase64: args.imageBase64,
      mimeType: args.mimeType,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`API preprod ${response.status}: ${details.slice(0, 220)}`);
  }

  const payload = (await response.json()) as {
    result?: AnalysisResult;
    tokensUsed?: number | null;
  };

  if (!payload.result) throw new Error('API preprod: resultat manquant.');
  return {
    result: payload.result,
    tokensUsed: typeof payload.tokensUsed === 'number' ? payload.tokensUsed : null,
  };
}

export default function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('settings');
  const [activeProvider, setActiveProvider] = useState<ProviderId | null>(null);
  const [history, setHistory] = useState<TranscriptionHistoryEntry[]>([]);
  const [settingsHydrated, setSettingsHydrated] = useState(false);
  const [historyHydrated, setHistoryHydrated] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      setSettings({ ...DEFAULT_SETTINGS, ...parsed });
    } catch (storageError) {
      console.warn('Impossible de charger les parametres depuis localStorage.', storageError);
    } finally {
      setSettingsHydrated(true);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as TranscriptionHistoryEntry[];
      if (Array.isArray(parsed)) {
        setHistory(parsed);
      }
    } catch (storageError) {
      console.warn('Impossible de charger l\'historique local.', storageError);
    } finally {
      setHistoryHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!settingsHydrated) return;
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings, settingsHydrated]);

  useEffect(() => {
    if (!historyHydrated) return;
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history, historyHydrated]);

  useEffect(() => {
    // Prevent browsers from opening dropped files directly in the current tab.
    const blockBrowserFileDrop = (event: DragEvent) => {
      event.preventDefault();
    };

    window.addEventListener('dragover', blockBrowserFileDrop);
    window.addEventListener('drop', blockBrowserFileDrop);
    return () => {
      window.removeEventListener('dragover', blockBrowserFileDrop);
      window.removeEventListener('drop', blockBrowserFileDrop);
    };
  }, []);

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      'SpeechSynthesisUtterance' in window;

    setIsSpeechSupported(supported);
    if (!supported) return;

    window.speechSynthesis.getVoices();
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleSelectedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Format invalide: veuillez charger une image.');
      return;
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
      setError('Type image non supporte. Utilisez JPG, PNG, WEBP ou HEIC.');
      return;
    }

    if (file.size <= 0) {
      setError('Fichier vide: veuillez selectionner une image valide.');
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setError('Image trop lourde (max 12 Mo).');
      return;
    }

    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
    setResult(null);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSelectedFile(file);
    }
  };

  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else {
          reject(new Error('Impossible de lire le fichier.'));
        }
      };
      reader.onerror = reject;
    });

  const processImage = async () => {
    if (!imageFile) return;
    setIsProcessing(true);
    setError(null);

    try {
      const providerOrder = buildProviderOrder(settings);
      const base64Data = await getBase64(imageFile);
      const mimeType = imageFile.type || 'image/jpeg';

      const attempts: string[] = [];
      let lastError: string | null = null;

      for (const provider of providerOrder) {
        const remaining = getRemainingTokens(settings, provider);
        if (remaining < settings.minTokensPerCall) {
          attempts.push(`${provider}: budget insuffisant (${remaining} < ${settings.minTokensPerCall})`);
          continue;
        }

        try {
          let tokensUsed: number | null = null;
          let providerResult: AnalysisResult;

          if (settings.runtimeMode === 'local') {
            if (provider === 'gemini') {
              const apiKey = effectiveApiKey(settings.geminiApiKey, GEMINI_ENV_KEY);
              if (!apiKey) {
                attempts.push('gemini: cle manquante');
                continue;
              }
              const outcome = await withRetry(
                () => analyzeWithGeminiLocal({ apiKey, imageBase64: base64Data, mimeType }),
                'Appel Gemini local',
              );
              providerResult = outcome.result;
              tokensUsed = outcome.tokensUsed;
            } else {
              const apiKey = effectiveApiKey(settings.gptApiKey, GPT_ENV_KEY);
              if (!apiKey) {
                attempts.push('gpt: cle manquante');
                continue;
              }
              const outcome = await withRetry(
                () => analyzeWithGptLocal({ apiKey, imageBase64: base64Data, mimeType }),
                'Appel GPT local',
              );
              providerResult = outcome.result;
              tokensUsed = outcome.tokensUsed;
            }
          } else {
            const outcome = await withRetry(
              () => analyzeWithPreprodBackend({ provider, imageBase64: base64Data, mimeType }),
              `Appel preprod ${provider}`,
            );
            providerResult = outcome.result;
            tokensUsed = outcome.tokensUsed;
          }

          const consumed = tokensUsed ?? estimatedFallbackTokens(providerResult);
          setSettings((prev) => updateRemainingTokens(prev, provider, consumed));
          setActiveProvider(provider);
          setResult(providerResult);
          setHistory((prev) => {
            const next: TranscriptionHistoryEntry[] = [
              {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                createdAt: new Date().toISOString(),
                provider,
                imageName: imageFile.name,
                result: providerResult,
              },
              ...prev,
            ];
            return next.slice(0, MAX_HISTORY_ITEMS);
          });
          return;
        } catch (providerError: any) {
          lastError = providerError?.message ?? String(providerError);
          attempts.push(`${provider}: ${lastError}`);

          if (!settings.autoFallback) {
            break;
          }
        }
      }

      throw new Error(`Echec analyse. Tentatives: ${attempts.join(' | ')}`);
    } catch (err: any) {
      console.error('Provider Error:', err);
      setError(`Erreur lors du traitement : ${err.message ?? 'Veuillez reessayer.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleAudio = () => {
    if (!isSpeechSupported) {
      setError('Lecture audio indisponible sur ce navigateur Android/webview.');
      return;
    }

    if (!result?.audioOptimizedTranscript) return;
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(result.audioOptimizedTranscript);
      const voices = window.speechSynthesis.getVoices();
      const frVoice = voices.find((v) => v.lang.startsWith('fr-'));
      if (frVoice) utterance.voice = frVoice;
      utterance.lang = 'fr-FR';
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  return (
    <div className="min-h-screen w-full bg-bg text-ink flex flex-col selection:bg-accent/30 selection:text-ink font-sans">
      <Header hasResult={!!result} />
      <HeroSection />

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-[1px] bg-[#e0dcd1] overflow-hidden">
        <InputPanel
          imagePreviewUrl={imagePreviewUrl}
          error={error}
          fileInputRef={fileInputRef}
          onFileChange={handleFileChange}
          onFileDrop={handleSelectedFile}
        />
        <TranscriptionPanel isProcessing={isProcessing} result={result} />
        <AudioPanel isProcessing={isProcessing} result={result} />
      </main>

      <FooterControls
        hasFile={!!imageFile}
        isProcessing={isProcessing}
        hasResult={!!result}
        isPlaying={isPlaying}
        isSpeechSupported={isSpeechSupported}
        activeProviderLabel={getProviderLabel(activeProvider)}
        onImport={() => fileInputRef.current?.click()}
        onProcess={processImage}
        onToggleAudio={toggleAudio}
        onOpenSettings={() => {
          setSettingsTab('settings');
          setSettingsOpen(true);
        }}
        onOpenHelp={() => {
          setSettingsTab('help');
          setSettingsOpen(true);
        }}
      />

      {settingsOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center text-white font-mono text-xs uppercase tracking-[1.5px]">
              Chargement des parametres...
            </div>
          }
        >
          <SettingsModal
            isOpen={settingsOpen}
            tab={settingsTab}
            settings={settings}
            history={history}
            onClose={() => setSettingsOpen(false)}
            onTabChange={setSettingsTab}
            onSettingsChange={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
            onResetTokenBudgets={() =>
              setSettings((prev) => ({
                ...prev,
                geminiRemainingTokens: DEFAULT_SETTINGS.geminiRemainingTokens,
                gptRemainingTokens: DEFAULT_SETTINGS.gptRemainingTokens,
              }))
            }
            onRestoreHistory={(entryId) => {
              const entry = history.find((item) => item.id === entryId);
              if (!entry) return;
              setResult(entry.result);
              setActiveProvider(entry.provider);
              setError(null);
              setSettingsOpen(false);
            }}
            onClearHistory={() => setHistory([])}
          />
        </Suspense>
      )}
    </div>
  );
}
