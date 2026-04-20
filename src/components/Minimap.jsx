import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function Minimap({ shapes, stickyNotes, stagePos, stageScale, onNavigate }) {
  const allElements = useMemo(() => {
    const el = [];
    Object.values(shapes).forEach(s => el.push({ x: s.x, y: s.y, w: s.width || 100, h: s.height || 100, color: s.color }));
    Object.values(stickyNotes).forEach(n => el.push({ x: n.get('x'), y: n.get('y'), w: 200, h: 150, color: n.get('backgroundColor') }));
    return el;
  }, [shapes, stickyNotes]);

  // Find bounds
  const bounds = useMemo(() => {
    if (allElements.length === 0) return { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    allElements.forEach(el => {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + el.w);
      maxY = Math.max(maxY, el.y + el.h);
    });
    // Add 10% padding
    const dx = maxX - minX;
    const dy = maxY - minY;
    return {
      minX: minX - dx * 0.1 - 500,
      minY: minY - dy * 0.1 - 500,
      maxX: maxX + dx * 0.1 + 500,
      maxY: maxY + dy * 0.1 + 500,
    };
  }, [allElements]);

  const mapWidth = 200;
  const mapHeight = 150;
  const scaleX = mapWidth / (bounds.maxX - bounds.minX);
  const scaleY = mapHeight / (bounds.maxY - bounds.minY);
  const scale = Math.min(scaleX, scaleY);

  const viewport = {
    x: (-stagePos.x / stageScale),
    y: (-stagePos.y / stageScale),
    w: window.innerWidth / stageScale,
    h: window.innerHeight / stageScale,
  };

  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / scale + bounds.minX;
    const clickY = (e.clientY - rect.top) / scale + bounds.minY;
    
    onNavigate({
      x: -clickX * stageScale + window.innerWidth / 2,
      y: -clickY * stageScale + window.innerHeight / 2,
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-20 right-6 w-[200px] h-[150px] bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-[1000] cursor-pointer group"
      onClick={handleMapClick}
    >
      {/* Elements */}
      {allElements.map((el, i) => (
        <div 
          key={i}
          style={{
            position: 'absolute',
            left: (el.x - bounds.minX) * scale,
            top: (el.y - bounds.minY) * scale,
            width: Math.max(2, el.w * scale),
            height: Math.max(2, el.h * scale),
            background: el.color,
            borderRadius: '1px',
            opacity: 0.6
          }}
        />
      ))}

      {/* Viewport Indicator */}
      <div 
        style={{
          position: 'absolute',
          left: (viewport.x - bounds.minX) * scale,
          top: (viewport.y - bounds.minY) * scale,
          width: viewport.w * scale,
          height: viewport.h * scale,
          border: '1.5px solid #6366f1',
          background: 'rgba(99, 102, 241, 0.1)',
          boxShadow: '0 0 0 1000px rgba(0,0,0,0.05)'
        }}
      />
      
      <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/50 rounded text-[9px] font-bold text-white uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
        Minimap
      </div>
    </motion.div>
  );
}
