// ============================================================
// MobileToolbar — Bottom toolbar for mobile devices
// ============================================================

import React, { useState, useEffect } from 'react';
import { Pencil, Eraser, Palette, Undo2, Trash2 } from 'lucide-react';

export default function MobileToolbar({
  tool,
  color,
  onToolChange,
  onColorChange,
  onUndo,
  onClear,
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!isMobile) return null;

  const buttons = [
    { id: 'pen', icon: Pencil, label: 'Pen' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'color', icon: Palette, label: 'Color', action: () => setShowColorPicker(!showColorPicker) },
    { id: 'undo', icon: Undo2, label: 'Undo', action: onUndo },
    { id: 'clear', icon: Trash2, label: 'Clear', action: onClear },
  ];

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '12px 16px',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          background: 'rgba(24, 24, 32, 0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {buttons.map((btn) => {
          const Icon = btn.icon;
          const isActive = btn.id === tool;
          const handleClick = () => {
            if (btn.action) {
              btn.action();
            } else {
              onToolChange?.(btn.id);
            }
          };

          return (
            <button
              key={btn.id}
              onClick={handleClick}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '54px',
                height: '54px',
                minWidth: '48px',
                minHeight: '48px',
                border: 'none',
                borderRadius: '14px',
                background: isActive ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                color: isActive ? '#6366f1' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                gap: '2px',
                position: 'relative',
                transition: 'all 0.15s ease',
              }}
            >
              {btn.id === 'color' ? (
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: color,
                    border: '2px solid rgba(255,255,255,0.2)',
                  }}
                />
              ) : (
                <Icon size={20} />
              )}
              <span style={{ fontSize: '9px', fontWeight: 500, marginTop: '1px' }}>
                {btn.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Color picker flyout */}
      {showColorPicker && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 201,
            background: 'rgba(24, 24, 32, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '12px',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            maxWidth: '200px',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.08)',
            animation: 'slideUp 0.15s ease',
          }}
        >
          {['#000000', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'].map((c) => (
            <button
              key={c}
              onClick={() => { onColorChange?.(c); setShowColorPicker(false); }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: color === c ? '3px solid white' : '2px solid rgba(255,255,255,0.15)',
                background: c,
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}
