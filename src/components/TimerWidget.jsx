// ============================================================
// TimerWidget — Collaborative Pomodoro timer floating panel
// ============================================================

import React, { useState, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Minimize2, Maximize2 } from 'lucide-react';

export default function TimerWidget({
  running,
  remaining,
  formattedTime,
  mode,
  sessions,
  isOwner,
  onStart,
  onPause,
  onReset,
  onSkip,
  onClose,
}) {
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 300, y: 120 });
  const dragRef = useRef(null);
  const dragStartRef = useRef(null);

  const handleDragStart = useCallback((e) => {
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };

    const handleDrag = (e) => {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    };

    const handleDragEnd = () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };

    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', handleDragEnd);
  }, [position]);

  const modeLabel = mode === 'work' ? '🍅 Focus' : mode === 'shortBreak' ? '☕ Short Break' : '🌴 Long Break';
  const modeColor = mode === 'work' ? '#ef4444' : mode === 'shortBreak' ? '#22c55e' : '#3b82f6';

  // Circular progress
  const totalDuration =
    mode === 'work' ? 25 * 60 * 1000 :
    mode === 'shortBreak' ? 5 * 60 * 1000 :
    15 * 60 * 1000;
  const progress = 1 - remaining / totalDuration;
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference * (1 - progress);

  if (minimized) {
    return (
      <div
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 8000,
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          border: '1px solid #e2e8f0',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          fontFamily: "'Inter', sans-serif",
        }}
        onClick={() => setMinimized(false)}
      >
        <span style={{ fontSize: '14px' }}>🍅</span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: modeColor, fontVariantNumeric: 'tabular-nums' }}>
          {formattedTime}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={dragRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 8000,
        width: '240px',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        border: '1px solid #e2e8f0',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden',
        animation: 'timerIn 0.2s ease',
      }}
    >
      {/* Header — draggable */}
      <div
        onMouseDown={handleDragStart}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: '#fafbfc',
          borderBottom: '1px solid #f1f5f9',
          cursor: 'grab',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
          {modeLabel}
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setMinimized(true)}
            style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
          >
            <Minimize2 size={13} />
          </button>
        </div>
      </div>

      {/* Timer circle */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0 16px' }}>
        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
          <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background circle */}
            <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f5f9" strokeWidth="6" />
            {/* Progress arc */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={modeColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
            }}
          >
            <span
              style={{
                fontSize: '28px',
                fontWeight: 800,
                color: '#0f172a',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.02em',
              }}
            >
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Session count */}
        <div style={{ display: 'flex', gap: '4px', marginTop: '10px' }}>
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: i < (sessions % 4) ? modeColor : '#e2e8f0',
                transition: 'background 0.2s ease',
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
          Session {sessions + 1}
        </span>
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          padding: '0 16px 16px',
        }}
      >
        <button
          onClick={onReset}
          disabled={!isOwner}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            background: 'white',
            color: '#64748b',
            cursor: isOwner ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isOwner ? 1 : 0.4,
          }}
          title="Reset"
        >
          <RotateCcw size={15} />
        </button>
        <button
          onClick={running ? onPause : onStart}
          disabled={!isOwner}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            border: 'none',
            background: modeColor,
            color: 'white',
            cursor: isOwner ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 12px ${modeColor}40`,
            opacity: isOwner ? 1 : 0.6,
          }}
          title={running ? 'Pause' : 'Start'}
        >
          {running ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
        </button>
        <button
          onClick={onSkip}
          disabled={!isOwner}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            background: 'white',
            color: '#64748b',
            cursor: isOwner ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isOwner ? 1 : 0.4,
          }}
          title="Skip"
        >
          <SkipForward size={15} />
        </button>
      </div>

      {!isOwner && (
        <div style={{ padding: '0 16px 12px', textAlign: 'center' }}>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
            Only the room owner can control the timer
          </span>
        </div>
      )}

      <style>{`
        @keyframes timerIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
