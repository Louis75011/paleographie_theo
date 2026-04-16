import React from 'react';

interface HeaderProps {
  hasResult: boolean;
}

export default function Header({ hasResult }: HeaderProps) {
  return (
    <header
      className="px-6 md:px-10 flex items-center justify-between border-b border-[#e0dcd1] shrink-0 h-[72px]"
      style={{ background: 'linear-gradient(90deg, #ffffff, #f9f7f1)' }}
      role="banner"
    >
      <div className="flex items-center gap-3">
        <img
          src="/images/tp-logo.jpg"
          alt="Logo Travaux Pratiques"
          className="h-10 w-10 object-contain rounded-sm shadow-sm"
          width={40}
          height={40}
        />
        <span className="font-display italic text-xl md:text-2xl tracking-[1px] text-ink">
          PALÉOGRAPHIA&nbsp;// THÉOBALD
        </span>
      </div>
      <div
        aria-label={hasResult ? 'Analyse active' : 'Expertise numérique active'}
        className="text-[10px] uppercase tracking-[2px] bg-accent/10 text-accent px-3 py-1 border border-accent/30 rounded-sm hidden sm:block"
      >
        {hasResult ? 'Analyse Complète' : 'Expertise Numérique Active'}
      </div>
    </header>
  );
}
