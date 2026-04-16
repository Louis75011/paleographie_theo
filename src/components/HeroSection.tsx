import React from 'react';

export default function HeroSection() {
    return (
        <section
            aria-label="Présentation de Paléographia"
            className="relative w-full max-h-[260px] overflow-hidden shrink-0 border-b border-[#e0dcd1]"
        >
            <img
                src="/images/footer_design_floral_clemence.jpg"
                alt="Composition florale ornementale – Paléographia par Théobald"
                className="w-full h-[260px] object-cover object-center"
                width={1200}
                height={260}
                fetchpriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40 flex flex-col items-center justify-end pb-6 px-8">
                <p className="text-white/90 font-display italic text-lg tracking-wide drop-shadow text-center max-w-xl">
                    Archive numérique & transcription paléographique
                </p>
            </div>
        </section>
    );
}
