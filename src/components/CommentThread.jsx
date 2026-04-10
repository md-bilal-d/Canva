// ============================================================
// CommentThread — Figma-style floating comment bubble
// ============================================================

import React, { useState, useRef, useEffect } from 'react';

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getAvatarColor(name) {
  const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function CommentThread({
  shapeId,
  comments = [],
  onAddComment,
  onResolveThread,
  onDeleteComment,
  onClose,
  position = { x: 0, y: 0 },
  currentUser,
}) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddComment?.(shapeId, {
      userId: currentUser?.id || 'unknown',
      userName: currentUser?.name || 'Anonymous',
      text: text.trim(),
    });
    setText('');
  };

  const isResolved = comments.length > 0 && comments.every((c) => c.resolved);

  return (
    <div
      ref={containerRef}
      className="comment-thread"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        zIndex: 5000,
        width: '300px',
        maxHeight: '400px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
        animation: 'commentIn 0.2s ease',
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid #f1f5f9',
          background: '#fafbfc',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
          Comments {comments.length > 0 && `(${comments.length})`}
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {!isResolved && comments.length > 0 && (
            <button
              onClick={() => onResolveThread?.(shapeId)}
              style={{
                fontSize: '11px',
                padding: '3px 10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: 'white',
                color: '#22c55e',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ✓ Resolve
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              width: '24px',
              height: '24px',
              border: 'none',
              background: 'transparent',
              color: '#9ca3af',
              cursor: 'pointer',
              fontSize: '16px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0', maxHeight: '260px' }}>
        {comments.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
            No comments yet. Start a conversation!
          </div>
        )}
        {comments.map((comment) => (
          <div
            key={comment.id}
            style={{
              padding: '8px 14px',
              display: 'flex',
              gap: '10px',
              opacity: comment.resolved ? 0.5 : 1,
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: getAvatarColor(comment.userName),
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {(comment.userName || '?')[0].toUpperCase()}
            </div>
            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                  {comment.userName}
                </span>
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                  {timeAgo(comment.timestamp)}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', margin: '2px 0 0', lineHeight: 1.4, wordBreak: 'break-word' }}>
                {comment.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      {!isResolved && (
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            gap: '6px',
            padding: '10px 12px',
            borderTop: '1px solid #f1f5f9',
            background: '#fafbfc',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            style={{
              flex: 1,
              padding: '7px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '13px',
              outline: 'none',
              fontFamily: "'Inter', sans-serif",
            }}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            style={{
              padding: '7px 14px',
              border: 'none',
              borderRadius: '8px',
              background: text.trim() ? '#6366f1' : '#e2e8f0',
              color: text.trim() ? 'white' : '#9ca3af',
              fontSize: '13px',
              fontWeight: 600,
              cursor: text.trim() ? 'pointer' : 'default',
            }}
          >
            Send
          </button>
        </form>
      )}

      <style>{`
        @keyframes commentIn {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
