// ============================================================
// ThemeToggle — Sun/Moon icon button for dark mode
// ============================================================

import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '38px',
        height: '38px',
        border: 'none',
        borderRadius: '10px',
        background: 'transparent',
        color: 'rgba(255,255,255,0.6)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
        e.currentTarget.style.color = 'white';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
      }}
    >
      <div
        style={{
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
          transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(180deg) scale(0)',
          opacity: isDark ? 1 : 0,
          position: 'absolute',
        }}
      >
        <Moon size={18} />
      </div>
      <div
        style={{
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
          transform: isDark ? 'rotate(-180deg) scale(0)' : 'rotate(0deg) scale(1)',
          opacity: isDark ? 0 : 1,
          position: 'absolute',
        }}
      >
        <Sun size={18} />
      </div>
    </button>
  );
}
