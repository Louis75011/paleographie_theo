import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { AnalysisResult } from '../types';

interface AudioPanelProps {
    isProcessing: boolean;
    result: AnalysisResult | null;
}

export default function AudioPanel({ isProcessing, result }: AudioPanelProps) {
    return (
        <section
            className="bg-bg p-6 flex flex-col overflow-y-auto"
            aria-label="Texte optimisé pour la lecture audio"
            aria-live="polite"
            aria-busy={isProcessing}
        >
            <h2 className="font-display text-[13px] uppercase tracking-[1.5px] text-text-dim mb-5 flex items-center gap-[10px] after:content-[''] after:h-[1px] after:bg-[#e0dcd1] after:flex-1">
                03. Optimisation Vocale
            </h2>

            <div className="flex flex-col gap-[15px]">
                {!result && !isProcessing && (
                    <p className="border-l-2 border-[#ddd] pl-4 py-2 font-mono text-[11px] text-[#888]">
                        Aucune préparation audio détectée.
                    </p>
                )}

                {isProcessing && (
                    <p className="border-l-2 border-accent/50 pl-4 py-2 font-mono text-[11px] text-accent/50 animate-pulse">
                        Adaptation phonétique en cours…
                    </p>
                )}

                {result && (
                    <div className="bg-black/[0.02] p-4 border-l-2 border-accent shadow-sm">
                        <span className="text-[10px] uppercase text-accent mb-2 block font-display tracking-[1px] font-bold">
                            Texte Lissé &amp; Préparé
                        </span>
                        <div className="text-[13px] leading-[1.5] text-[#333] font-sans prose prose-stone prose-sm max-w-none">
                            <ReactMarkdown>{result.audioOptimizedTranscript}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
