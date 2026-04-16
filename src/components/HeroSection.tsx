import React from 'react';

export default function HeroSection() {
  return (
    <>
      {/* Bannière d'accueil – tp-banniere.jpg */}
      <section
        aria-label="Présentation de Paléographia"
        className="relative w-full overflow-hidden shrink-0 border-b border-[#e0dcd1]"
        style={{ maxHeight: '260px' }}
      >
        <img
          src="/images/tp-banniere.jpg"
          alt="Travaux Pratiques – Bannière Paléographia"
          className="w-full h-[260px] object-cover object-center"
          width={1200}
          height={260}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50 flex flex-col items-center justify-end pb-6 px-8">
          <p className="text-white/90 font-display italic text-lg tracking-wide drop-shadow text-center max-w-xl">
            Archive numérique &amp; transcription paléographique
          </p>
        </div>
      </section>
    </>
  );
}
