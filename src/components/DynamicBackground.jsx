import React, { useEffect, useState } from 'react';

/**
 * A premium, immersive background component that renders subtle,
 * animated "Aura" blobs in the background.
 * Now responds to the board's Brand Kit colors.
 */
export default function DynamicBackground({ ydoc }) {
  const [colors, setColors] = useState(['#e0e7ff', '#fce7f3', '#dbeafe']); // Default indigo, pink, blue tints

  useEffect(() => {
    if (!ydoc) return;
    const yMap = ydoc.getMap('brandKit');
    
    const observe = () => {
        const brandColors = yMap.get('colors');
        if (brandColors && brandColors.length >= 2) {
            // Create subtle tints from brand colors
            setColors([
                brandColors[0] + '22', // 22 is ~13% opacity in hex
                brandColors[1] + '22',
                (brandColors[2] || brandColors[0]) + '22'
            ]);
        }
    };

    yMap.observe(observe);
    observe();
    return () => yMap.unobserve(observe);
  }, [ydoc]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50">
      {/* Aurora Blurs */}
      <div 
        className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[120px] animate-aura"
        style={{ animationDelay: '0s', backgroundColor: colors[0] }}
      />
      <div 
        className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-aura"
        style={{ animationDelay: '-5s', backgroundColor: colors[1] }}
      />
      <div 
        className="absolute -bottom-[10%] left-[20%] w-[55%] h-[55%] rounded-full blur-[120px] animate-aura"
        style={{ animationDelay: '-10s', backgroundColor: colors[2] }}
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
