import React from 'react';

/**
 * A premium, immersive background component that renders subtle,
 * animated "Aura" blobs in the background.
 */
export default function DynamicBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50">
      {/* Aurora Blurs */}
      <div 
        className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-indigo-200/20 blur-[120px] animate-aura"
        style={{ animationDelay: '0s' }}
      />
      <div 
        className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-pink-200/20 blur-[120px] animate-aura"
        style={{ animationDelay: '-5s' }}
      />
      <div 
        className="absolute -bottom-[10%] left-[20%] w-[55%] h-[55%] rounded-full bg-blue-200/20 blur-[120px] animate-aura"
        style={{ animationDelay: '-10s' }}
      />
      
      {/* Subtle Noise/Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3%3Cfilter id='noiseFilter'%3%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3%3C/filter%3%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3%3C/svg%3")` 
        }}
      />
    </div>
  );
}
