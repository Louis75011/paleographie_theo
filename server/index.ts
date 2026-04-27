import dotenv from 'dotenv';
import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { SYSTEM_INSTRUCTION } from '../src/constants';
import type { AnalysisResult, ProviderId } from '../src/types';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(express.json({ limit: '20mb' }));

function parseAnalysisResult(raw: string): AnalysisResult {
    const parsed = JSON.parse(raw) as Partial<AnalysisResult>;
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

function extractGeminiUsedTokens(response: any): number | null {
    const total = response?.usageMetadata?.totalTokenCount;
    return typeof total === 'number' ? total : null;
}

async function analyzeWithGemini(imageBase64: string, mimeType: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY manquante cote serveur.');

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro-preview-06-05',
        contents: {
            parts: [
                { text: 'Transpose et prepare cette page pour lecture audio selon tes instructions.' },
                { inlineData: { data: imageBase64, mimeType } },
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

    if (!response.text) throw new Error('Gemini a retourne une reponse vide.');

    return {
        result: parseAnalysisResult(response.text),
        tokensUsed: extractGeminiUsedTokens(response),
    };
}

async function analyzeWithGpt(imageBase64: string, mimeType: string) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY manquante cote serveur.');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
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
                        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
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
        throw new Error('Reponse GPT invalide.');
    }

    return {
        result: parseAnalysisResult(extractJsonObject(content)),
        tokensUsed: typeof data?.usage?.total_tokens === 'number' ? data.usage.total_tokens : null,
    };
}

app.get('/api/health', (_req, res) => {
    res.json({ ok: true, uptime: process.uptime() });
});

app.post('/api/analyze', async (req, res) => {
    try {
        const provider = req.body?.provider as ProviderId;
        const imageBase64 = req.body?.imageBase64 as string;
        const mimeType = (req.body?.mimeType as string) || 'image/jpeg';

        if (!provider || (provider !== 'gemini' && provider !== 'gpt')) {
            res.status(400).json({ error: 'provider invalide (gemini|gpt attendu).' });
            return;
        }

        if (!imageBase64 || typeof imageBase64 !== 'string') {
            res.status(400).json({ error: 'imageBase64 requis.' });
            return;
        }

        const outcome =
            provider === 'gemini'
                ? await analyzeWithGemini(imageBase64, mimeType)
                : await analyzeWithGpt(imageBase64, mimeType);

        res.json({
            provider,
            result: outcome.result,
            tokensUsed: outcome.tokensUsed,
        });
    } catch (error: any) {
        console.error('POST /api/analyze failed:', error);
        res.status(500).json({
            error: error?.message ?? 'Erreur serveur inattendue',
        });
    }
});

app.listen(port, () => {
    console.log(`Preprod API listening on http://localhost:${port}`);
});
