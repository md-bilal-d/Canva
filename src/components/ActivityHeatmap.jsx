import React, { useEffect, useRef, useState } from 'react';

export default function ActivityHeatmap({ isOpen, cursors, stagePos, stageScale }) {
  const canvasRef = useRef(null);
  const pointsRef = useRef([]); // {x, y, t}
  
  // Track cursors into a visual buffer
  useEffect(() => {
    if (!isOpen) return;

    Object.values(cursors).forEach(cursor => {
      if (cursor.x && cursor.y) {
        pointsRef.current.push({ x: cursor.x, y: cursor.y, t: Date.now() });
      }
    });

    // Keep last 1000 points
    if (pointsRef.current.length > 5000) {
        pointsRef.current = pointsRef.current.slice(-5000);
    }
  }, [cursors, isOpen]);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const draw = () => {
      if (!isOpen) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const now = Date.now();
      // Filter out old points (> 30 seconds)
      pointsRef.current = pointsRef.current.filter(p => now - p.t < 30000);

      // Draw heatmap points
      pointsRef.current.forEach(p => {
        // Convert board coords to screen coords
        const screenX = p.x * stageScale + stagePos.x;
        const screenY = p.y * stageScale + stagePos.y;
        
        const age = (now - p.t) / 30000; // 0 to 1
        const alpha = (1 - age) * 0.15;
        
        const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, 50 * stageScale);
        gradient.addColorStop(0, `rgba(255, 100, 0, ${alpha})`);
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX - 50 * stageScale, screenY - 50 * stageScale, 100 * stageScale, 100 * stageScale);
      });

      requestAnimationFrame(draw);
    };

    const animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, stagePos, stageScale]);

  if (!isOpen) return null;

  return (
    <canvas 
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      className="fixed inset-0 pointer-events-none z-[500] opacity-60 mix-blend-screen"
    />
  );
}
