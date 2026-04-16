import React from 'react';

interface HeaderProps {
  hasResult: boolean;
}

export default function Header({ hasResult }: HeaderProps) {
  return (
    <header
      className="h-[80px] px-10 flex items-center justify-between border-b border-[#e0dcd1] shrink-0"
      style={{ background: 'linear-gradient(90deg, #ffffff, #f9f7f1)' }}
      role="banner"
    >
      <div className="flex items-center gap-4">
        <img
          src="/images/tp-logo.jpg"
          alt="Logo Travaux Pratiques"
          className="h-10 w-auto object-contain"
          width={40}
          height={40}
        />
        <span className="font-display italic text-2xl tracking-[1px] font-normal text-ink">
          PALÉOGRAPHIA&nbsp;// THÉOBALD
        </span>
      </div>
      <div
        aria-label={hasResult ? 'Analyse active' : 'Expertise numérique active'}
        className="text-[10px] uppercase tracking-[2px] bg-accent/10 text-accent px-3 py-1 border border-accent/30 rounded-sm"
      >
        {hasResult ? 'Analyse Complète' : 'Expertise Numérique Active'}
      </div>
    </header>
  );
}
