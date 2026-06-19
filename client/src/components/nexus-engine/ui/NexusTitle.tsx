import React from 'react';

export const NexusTitle: React.FC = () => {
  return (
    <div className="text-center mb-8 px-4 max-w-2xl mx-auto">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/20 text-[#00E5FF] text-xs font-mono tracking-widest uppercase mb-4 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
        Nexus Artificial Core Active
      </div>
      <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-4 font-sans">
        Explora el <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00E5FF] via-[#0055FF] to-[#9B51E0]">Nexus Hive</span>
      </h2>
      <p className="text-gray-400 text-sm md:text-base font-light font-sans">
        El panal holográfico de inteligencia artificial conecta todos los universos de anime, analizando relaciones de género, popularidad y recomendaciones en tiempo real.
      </p>
    </div>
  );
};
