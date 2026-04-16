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
