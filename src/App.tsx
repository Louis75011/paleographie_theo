import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import type { AnalysisResult } from './types';
import { SYSTEM_INSTRUCTION } from './constants';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import InputPanel from './components/InputPanel';
import TranscriptionPanel from './components/TranscriptionPanel';
import AudioPanel from './components/AudioPanel';
import FooterControls from './components/FooterControls';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
      setResult(null);
      setError(null);
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
      const base64Data = await getBase64(imageFile);
      const mimeType = imageFile.type || 'image/jpeg';
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro-preview-06-05',
        contents: {
          parts: [
            { text: 'Transpose et prépare cette page pour lecture audio selon tes instructions.' },
            { inlineData: { data: base64Data, mimeType } },
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
                description: "Le texte brut nettoyé fidèlement transcrit depuis l'image.",
              },
              audioOptimizedTranscript: {
                type: Type.STRING,
                description: 'La version optimisée pour la synthèse vocale.',
              },
            },
            required: ['originalTranscript', 'audioOptimizedTranscript'],
          },
          temperature: 0.2,
        },
      });
      const text = response.text;
      if (text) {
        setResult(JSON.parse(text) as AnalysisResult);
      } else {
        throw new Error("Aucune réponse de l'API.");
      }
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      setError(`Erreur lors du traitement : ${err.message ?? 'Veuillez réessayer.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleAudio = () => {
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

  useEffect(() => {
    window.speechSynthesis.getVoices();
    return () => { window.speechSynthesis.cancel(); };
  }, []);

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
        />
        <TranscriptionPanel isProcessing={isProcessing} result={result} />
        <AudioPanel isProcessing={isProcessing} result={result} />
      </main>

      <FooterControls
        hasFile={!!imageFile}
        isProcessing={isProcessing}
        hasResult={!!result}
        isPlaying={isPlaying}
        onImport={() => fileInputRef.current?.click()}
        onProcess={processImage}
        onToggleAudio={toggleAudio}
      />
    </div>
  );
}


const processImage = async () => {
  if (!imageFile) return;

  setIsProcessing(true);
  setError(null);

  try {
    const base64Data = await getBase64(imageFile);
    const mimeType = imageFile.type || 'image/jpeg';

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: {
        parts: [
          {
            text: "Transpose et prépare cette page pour lecture audio selon tes instructions.",
          },
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            originalTranscript: {
              type: Type.STRING,
              description: "Le texte brut nettoyé (sans numéros de page/en-têtes) fidèlement transcrit depuis l'image.",
            },
            audioOptimizedTranscript: {
              type: Type.STRING,
              description: "La version optimisée pour la synthèse vocale (nombres en toutes lettres, aucunes abréviations, marques de pauses).",
            },
          },
          required: ['originalTranscript', 'audioOptimizedTranscript'],
        },
        temperature: 0.2, // Low temperature for high accuracy OCR
      },
    });

    const text = response.text;
    if (text) {
      const parsedResult: AnalysisResult = JSON.parse(text);
      setResult(parsedResult);
      setActiveTab('original');
    } else {
      throw new Error("No response text from Gemini API.");
    }
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    setError(`Une erreur est survenue lors du traitement: ${err.message || 'Veuillez réessayer.'}`);
  } finally {
    setIsProcessing(false);
  }
};

const toggleAudio = () => {
  if (!result?.audioOptimizedTranscript) return;

  if (isPlaying) {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  } else {
    const utterance = new SpeechSynthesisUtterance(result.audioOptimizedTranscript);
    // Try to find a French voice
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

// Ensure voices are loaded so when play is clicked it doesn't default strangely if not needed
React.useEffect(() => {
  if (typeof window !== 'undefined') {
    window.speechSynthesis.getVoices();
  }
  return () => {
    if (typeof window !== 'undefined') window.speechSynthesis.cancel();
  }
}, []);

return (
  <div className="h-screen w-full bg-bg text-ink flex flex-col overflow-hidden selection:bg-accent/30 selection:text-ink font-sans">
    <header className="h-[80px] px-10 flex items-center justify-between border-b border-[#e0dcd1] shrink-0" style={{ background: 'linear-gradient(90deg, #ffffff, #f9f7f1)' }}>
      <div className="font-display italic text-2xl tracking-[1px] font-normal text-ink">PALEOGRAPHIA // THÉOBALD</div>
      <div className="text-[10px] uppercase tracking-[2px] bg-accent/10 text-accent px-3 py-1 border border-accent/30 rounded-sm">Expertise Numérique Active</div>
    </header>

    <main className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-[1px] bg-[#e0dcd1] overflow-hidden">
      {/* LEFT COLUMN: Input Visuel */}
      <section className="bg-bg p-6 flex flex-col overflow-y-auto">
        <div className="font-display text-[13px] uppercase tracking-[1.5px] text-text-dim mb-5 flex items-center gap-[10px] after:content-[''] after:h-[1px] after:bg-[#e0dcd1] after:flex-1">01. Input Visuel</div>

        <div
          className={`flex-1 bg-[#f4f1e8] border border-dashed border-[#ccc] flex flex-col items-center justify-center relative min-h-[300px] cursor-pointer transition-colors ${imagePreviewUrl ? '' : 'hover:border-accent/50 hover:bg-[#eae6db]'}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          {imagePreviewUrl ? (
            <div className="relative w-full h-full flex flex-col justify-center items-center p-2">
              <img
                src={imagePreviewUrl}
                alt="Preview"
                className="max-w-full max-h-[400px] object-contain shadow-md"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                <span className="bg-white/90 text-ink backdrop-blur-md px-3 py-1.5 rounded-sm text-[11px] uppercase tracking-[1px] border border-[#ddd] shadow-sm pointer-events-auto hover:border-[#bbb] transition-colors font-mono">
                  Changer (IMG)
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <div className="w-[140px] h-[190px] bg-paper shadow-lg p-4 text-ink relative flex flex-col border border-[#ddd]">
                <div className="text-[8px] font-bold mb-3 text-right font-sans">PAGE 142</div>
                <div className="h-1 bg-black/10 mb-2"></div>
                <div className="h-1 bg-black/10 mb-2"></div>
                <div className="h-1 bg-black/10 mb-2"></div>
                <div className="h-1 bg-black/10 mb-2 w-[60%]"></div>
                <div className="h-[30px] border border-[#ddd] my-3 flex items-center justify-center bg-white/50">
                  <Upload className="w-4 h-4 text-black/40" />
                </div>
                <div className="h-1 bg-black/10 mb-2"></div>
                <div className="h-1 bg-black/10 mb-2"></div>
              </div>
              <div className="mt-5 text-text-dim text-[11px] font-mono">CLIQUER OU GLISSER UNE IMAGE</div>
            </div>
          )}
        </div>
        {error && <div className="mt-4 text-[11px] font-mono text-red-600 border border-red-200 bg-red-50 p-3">{error}</div>}
      </section>

      {/* MIDDLE COLUMN: Transcription */}
      <section className="bg-bg p-6 flex flex-col overflow-hidden">
        <div className="font-display text-[13px] uppercase tracking-[1.5px] text-text-dim mb-5 flex items-center gap-[10px] after:content-[''] after:h-[1px] after:bg-[#e0dcd1] after:flex-1">02. Transcription Fidèle</div>

        <div className="flex-1 bg-panel border border-[#e0dcd1] rounded-[4px] p-6 font-display text-[15px] leading-[1.6] text-ink relative flex flex-col shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-[40px] bg-gradient-to-b from-panel to-transparent pointer-events-none z-10"></div>

          <div className="flex-1 overflow-y-auto no-scrollbar pt-2 pb-6 prose prose-stone prose-p:text-[#444] prose-headings:text-ink max-w-none">
            {!result && !isProcessing && (
              <div className="h-full flex items-center justify-center text-text-dim font-mono text-sm relative z-0">
                [ EN ATTENTE DU DOCUMENT ]
              </div>
            )}
            {isProcessing && (
              <div className="h-full flex flex-col items-center justify-center text-accent/80 font-mono text-sm gap-4">
                <Loader2 className="w-6 h-6 animate-spin" />
                [ DÉCHIFFRAGE EN COURS ]
              </div>
            )}
            {result && (
              <ReactMarkdown>{result.originalTranscript}</ReactMarkdown>
            )}
          </div>
        </div>
      </section>

      {/* RIGHT COLUMN: Audio Prep */}
      <section className="bg-bg p-6 flex flex-col overflow-y-auto">
        <div className="font-display text-[13px] uppercase tracking-[1.5px] text-text-dim mb-5 flex items-center gap-[10px] after:content-[''] after:h-[1px] after:bg-[#e0dcd1] after:flex-1">03. Optimisation Vocale</div>

        <div className="flex flex-col gap-[15px]">
          {!result && !isProcessing && (
            <div className="border-l-2 border-[#ddd] pl-4 py-2 font-mono text-[11px] text-[#888]">
              Aucune préparation audio détectée.
            </div>
          )}

          {isProcessing && (
            <div className="border-l-2 border-accent/50 pl-4 py-2 font-mono text-[11px] text-accent/50 animate-pulse">
              Adaptation phonétique en cours...
            </div>
          )}

          {result && (
            <div className="bg-black/[0.02] p-4 border-l-2 border-accent shadow-sm">
              <span className="text-[10px] uppercase text-accent mb-2 block font-display tracking-[1px] font-bold">Texte Lissé & Préparé</span>
              <div className="text-[13px] leading-[1.5] text-[#333] font-sans prose prose-stone prose-sm max-w-none">
                <ReactMarkdown>{result.audioOptimizedTranscript}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>

    {/* FOOTER CONTROLS */}
    <footer className="h-[100px] bg-panel flex items-center justify-center gap-10 border-t border-[#e0dcd1] shrink-0 relative shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
      <button
        onClick={() => fileInputRef.current?.click()}
        className="bg-transparent border border-[#ccc] text-ink px-[30px] py-[12px] text-[12px] uppercase tracking-[2px] cursor-pointer hover:border-[#aaa] hover:bg-black/5 transition-colors"
      >
        Importer Photo (+)
      </button>

      <button
        onClick={processImage}
        disabled={!imageFile || isProcessing}
        className="bg-accent border border-accent text-white font-bold px-[30px] py-[12px] text-[12px] uppercase tracking-[2px] cursor-pointer hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
      >
        {isProcessing ? 'Déchiffrage...' : 'Lancer l\'Analyse (Run)'}
      </button>

      <button
        onClick={toggleAudio}
        disabled={!result}
        className="flex items-center gap-[10px] bg-transparent border border-accent text-accent px-[30px] py-[12px] text-[12px] uppercase tracking-[2px] cursor-pointer hover:bg-accent/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:border-[#ccc] disabled:text-[#888]"
      >
        <span className="text-base leading-none">{isPlaying ? '⏹' : '🔊'}</span> {isPlaying ? 'Arrêter la lecture' : 'Écouter le résultat'}
      </button>

      <div className="absolute bottom-[20px] left-[40px] text-[10px] text-text-dim font-mono hidden md:block">
        SYSTEM: OCR-ENGINE-B4 // TTS-HD-GEN2 // FORGE-ENV-STABLE
      </div>
    </footer>
  </div>
);
}

