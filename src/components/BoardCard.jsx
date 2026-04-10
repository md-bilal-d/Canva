// ============================================================
// BoardCard — Card for "My Boards" grid
// ============================================================

import React, { useState } from 'react';
import { MoreHorizontal, ExternalLink, Edit2, Trash2 } from 'lucide-react';

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function BoardCard({ board, onOpen, onRename, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(board.name || 'Untitled Board');

  const handleRename = () => {
    if (name.trim() && name !== board.name) {
      onRename?.(board.room_id, name.trim());
    }
    setEditing(false);
  };

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: isHovered ? '0 8px 24px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
        transform: isHovered ? 'translateY(-2px)' : 'none',
        fontFamily: "'Inter', sans-serif",
        position: 'relative',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowMenu(false); }}
      onClick={() => !editing && !showMenu && onOpen?.(board.room_id)}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: '100%',
          height: '160px',
          background: board.thumbnail_base64
            ? `url(${board.thumbnail_base64}) center/cover`
            : 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {!board.thumbnail_base64 && (
          <span style={{ fontSize: '32px', opacity: 0.3 }}>🎨</span>
        )}

        {/* Hover actions */}
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onOpen?.(board.room_id); }}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                background: 'white',
                color: '#0f172a',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ExternalLink size={13} /> Open
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {editing ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') setEditing(false);
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: '14px',
                fontWeight: 600,
                border: '1px solid #6366f1',
                borderRadius: '6px',
                padding: '2px 8px',
                outline: 'none',
                flex: 1,
                fontFamily: "'Inter', sans-serif",
              }}
            />
          ) : (
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
              {board.name || 'Untitled Board'}
            </h3>
          )}

          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.15s ease',
              }}
            >
              <MoreHorizontal size={16} />
            </button>

            {showMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  background: 'white',
                  borderRadius: '10px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  border: '1px solid #e2e8f0',
                  padding: '4px',
                  zIndex: 100,
                  minWidth: '120px',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => { setEditing(true); setShowMenu(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                    padding: '8px 12px', border: 'none', background: 'transparent',
                    borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#374151',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <Edit2 size={13} /> Rename
                </button>
                <button
                  onClick={() => { onDelete?.(board.room_id); setShowMenu(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                    padding: '8px 12px', border: 'none', background: 'transparent',
                    borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#ef4444',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Edited {timeAgo(board.updated_at)}</span>
          {board.members && board.members.length > 0 && (
            <div style={{ display: 'flex' }}>
              {board.members.slice(0, 3).map((m, i) => (
                <div
                  key={i}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: m.color || '#6366f1',
                    border: '2px solid white',
                    marginLeft: i > 0 ? '-6px' : 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8px',
                    fontWeight: 700,
                    color: 'white',
                  }}
                  title={m.name}
                >
                  {(m.name || '?')[0]}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
