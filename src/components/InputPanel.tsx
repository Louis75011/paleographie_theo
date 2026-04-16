import React from 'react';
import { Upload } from 'lucide-react';

interface InputPanelProps {
  imagePreviewUrl: string | null;
  error: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function InputPanel({
  imagePreviewUrl,
  error,
  fileInputRef,
  onFileChange,
}: InputPanelProps) {
  return (
    <section
      className="bg-bg p-6 flex flex-col overflow-y-auto"
      aria-label="Téléversement de l'image"
    >
      <h2 className="font-display text-[13px] uppercase tracking-[1.5px] text-text-dim mb-5 flex items-center gap-[10px] after:content-[''] after:h-[1px] after:bg-[#e0dcd1] after:flex-1">
        01. Input Visuel
      </h2>

      <div
        role="button"
        tabIndex={0}
        aria-label="Cliquer ou glisser une image de page de manuscrit"
        className={`flex-1 bg-[#f4f1e8] border border-dashed border-[#ccc] flex flex-col items-center justify-center relative min-h-[300px] cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
          imagePreviewUrl ? '' : 'hover:border-accent/50 hover:bg-[#eae6db]'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          accept="image/*"
          className="hidden"
          aria-hidden="true"
        />

        {imagePreviewUrl ? (
          <div className="relative w-full h-full flex flex-col justify-center items-center p-2">
            <img
              src={imagePreviewUrl}
              alt="Aperçu de la page à transcrire"
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
            <div className="w-[140px] h-[190px] bg-paper shadow-lg p-4 text-ink relative flex flex-col border border-[#ddd]" aria-hidden="true">
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
            <p className="mt-5 text-text-dim text-[11px] font-mono">CLIQUER OU GLISSER UNE IMAGE</p>
          </div>
        )}
      </div>

      {error && (
        <div role="alert" className="mt-4 text-[11px] font-mono text-red-700 border border-red-200 bg-red-50 p-3">
          {error}
        </div>
      )}
    </section>
  );
}
