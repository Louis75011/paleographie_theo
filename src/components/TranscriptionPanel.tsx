import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { AnalysisResult } from '../types';
import LazyMarkdown from './LazyMarkdown';

interface TranscriptionPanelProps {
    isProcessing: boolean;
    result: AnalysisResult | null;
}

export default function TranscriptionPanel({ isProcessing, result }: TranscriptionPanelProps) {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [canScrollUp, setCanScrollUp] = useState(false);
    const [canScrollDown, setCanScrollDown] = useState(false);

    const updateScrollState = () => {
        const node = scrollAreaRef.current;
        if (!node) {
            setCanScrollUp(false);
            setCanScrollDown(false);
            return;
        }

        const maxScrollTop = node.scrollHeight - node.clientHeight;
        setCanScrollUp(node.scrollTop > 8);
        setCanScrollDown(maxScrollTop - node.scrollTop > 8);
    };

    useEffect(() => {
        updateScrollState();
        const timer = window.setTimeout(updateScrollState, 60);
        return () => window.clearTimeout(timer);
    }, [isProcessing, result]);

    const scrollByPage = (direction: 'up' | 'down') => {
        const node = scrollAreaRef.current;
        if (!node) return;
        const delta = Math.max(200, node.clientHeight * 0.7);
        node.scrollBy({
            top: direction === 'up' ? -delta : delta,
            behavior: 'smooth',
        });
    };

    return (
        <section
            className="bg-bg p-6 flex flex-col min-h-[340px] lg:min-h-0 overflow-hidden"
            aria-label="Transcription fidèle du document"
            aria-live="polite"
            aria-busy={isProcessing}
        >
            <h2 className="font-display text-[13px] uppercase tracking-[1.5px] text-text-dim mb-5 flex items-center gap-[10px] after:content-[''] after:h-[1px] after:bg-[#e0dcd1] after:flex-1">
                02. Transcription Fidèle
            </h2>

            <div className="flex-1 bg-panel border border-[#e0dcd1] rounded-[4px] p-6 font-display text-[15px] leading-[1.6] text-ink relative flex flex-col shadow-sm">
                <div className="absolute top-0 left-0 right-0 h-[40px] bg-gradient-to-b from-panel to-transparent pointer-events-none z-10" aria-hidden="true" />

                <div
                    ref={scrollAreaRef}
                    onScroll={updateScrollState}
                    className="flex-1 overflow-y-auto no-scrollbar pt-2 pb-6 prose prose-stone prose-p:text-[#444] prose-headings:text-ink max-w-none"
                >
                    {!result && !isProcessing && (
                        <p className="h-full flex items-center justify-center text-text-dim font-mono text-sm">
                            [ EN ATTENTE DU DOCUMENT ]
                        </p>
                    )}
                    {isProcessing && (
                        <div className="h-full flex flex-col items-center justify-center text-accent/80 font-mono text-sm gap-4">
                            <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
                            <span>[ DÉCHIFFRAGE EN COURS ]</span>
                        </div>
                    )}
                    {result && <LazyMarkdown>{result.originalTranscript}</LazyMarkdown>}
                </div>

                <div className="absolute right-4 bottom-4 z-20 flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={() => scrollByPage('up')}
                        disabled={!canScrollUp}
                        aria-label="Remonter dans la transcription"
                        className="h-9 w-9 rounded-full border border-[#ccc] bg-white/95 text-ink text-sm shadow-sm hover:bg-white disabled:opacity-35 disabled:cursor-not-allowed"
                    >
                        ↑
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollByPage('down')}
                        disabled={!canScrollDown}
                        aria-label="Descendre dans la transcription"
                        className="h-9 w-9 rounded-full border border-[#ccc] bg-white/95 text-ink text-sm shadow-sm hover:bg-white disabled:opacity-35 disabled:cursor-not-allowed"
                    >
                        ↓
                    </button>
                </div>
            </div>
        </section>
    );
}
