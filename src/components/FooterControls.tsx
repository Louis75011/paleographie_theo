import React from 'react';

interface FooterControlsProps {
  hasFile: boolean;
  isProcessing: boolean;
  hasResult: boolean;
  isPlaying: boolean;
  onImport: () => void;
  onProcess: () => void;
  onToggleAudio: () => void;
}

export default function FooterControls({
  hasFile,
  isProcessing,
  hasResult,
  isPlaying,
  onImport,
  onProcess,
  onToggleAudio,
}: FooterControlsProps) {
  return (
    <footer
      className="h-[100px] bg-panel flex items-center justify-center gap-10 border-t border-[#e0dcd1] shrink-0 relative shadow-[0_-4px_20px_rgba(0,0,0,0.02)]"
      role="toolbar"
      aria-label="Actions principales"
    >
      <button
        onClick={onImport}
        type="button"
        className="bg-transparent border border-[#ccc] text-ink px-[30px] py-[12px] text-[12px] uppercase tracking-[2px] cursor-pointer hover:border-[#aaa] hover:bg-black/5 transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        Importer Photo (+)
      </button>

      <button
        onClick={onProcess}
        disabled={!hasFile || isProcessing}
        type="button"
        aria-label={isProcessing ? 'Déchiffrage en cours, veuillez patienter' : 'Lancer l\'analyse de la page'}
        className="bg-accent border border-accent text-white font-bold px-[30px] py-[12px] text-[12px] uppercase tracking-[2px] cursor-pointer hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {isProcessing ? 'Déchiffrage…' : "Lancer l'Analyse"}
      </button>

      <button
        onClick={onToggleAudio}
        disabled={!hasResult}
        type="button"
        aria-label={isPlaying ? 'Arrêter la lecture audio' : 'Écouter le texte optimisé'}
        aria-pressed={isPlaying}
        className="flex items-center gap-[10px] bg-transparent border border-accent text-accent px-[30px] py-[12px] text-[12px] uppercase tracking-[2px] cursor-pointer hover:bg-accent/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:border-[#ccc] disabled:text-[#888] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      >
        <span className="text-base leading-none" aria-hidden="true">{isPlaying ? '⏹' : '🔊'}</span>
        {isPlaying ? 'Arrêter' : 'Écouter'}
      </button>

      <p className="absolute bottom-[20px] left-[40px] text-[10px] text-text-dim font-mono hidden md:block" aria-hidden="true">
        OCR-ENGINE-B4 // TTS-HD-GEN2 // Paléographia
      </p>
    </footer>
  );
}
