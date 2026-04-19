import React, { useEffect, useRef } from 'react';

export default function CursorChat({ x, y, color, value, onChange, onFinish, isLocal }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isLocal && inputRef.current) {
        inputRef.current.focus();
    }
  }, [isLocal]);

  const containerStyle = {
    position: 'absolute',
    left: x + 15,
    top: y + 15,
    transform: 'translateY(-100%)',
    zIndex: 1000,
    pointerEvents: 'auto',
  };

  const bubbleStyle = {
    background: isLocal ? 'white' : color,
    color: isLocal ? '#1e293b' : 'white',
    padding: '6px 14px',
    borderRadius: '16px 16px 16px 4px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    border: isLocal ? `2px solid ${color}` : 'none',
    fontSize: '14px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    animation: 'chat-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  };

  if (!isLocal && !value) return null;

  return (
    <div style={containerStyle}>
      <div style={bubbleStyle}>
        {isLocal ? (
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                  onFinish();
              }
              if (e.key === 'Escape') {
                  onChange('');
                  onFinish();
              }
            }}
            placeholder="Type a message..."
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              width: '150px',
              fontSize: '14px',
              color: 'inherit',
            }}
          />
        ) : (
          <span>{value}</span>
        )}
      </div>
      <style>{`
        @keyframes chat-pop {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
