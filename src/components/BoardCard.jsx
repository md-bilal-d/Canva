// ============================================================
// BoardCard — Card for "My Boards" grid (Premium Dark Mode)
// ============================================================

import React, { useState } from 'react';
import { MoreHorizontal, ExternalLink, Edit2, Trash2 } from 'lucide-react';

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
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
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '20px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isHovered ? '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(139, 92, 246, 0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
        transform: isHovered ? 'translateY(-4px)' : 'none',
        fontFamily: "'Inter', sans-serif",
        position: 'relative',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowMenu(false); }}
      onClick={() => !editing && !showMenu && onOpen?.(board.room_id)}
    >
      {/* Background Glow Layer on Hover */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(100% 100% at 50% 0%, rgba(139, 92, 246, 0.1) 0%, transparent 100%)',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Thumbnail */}
      <div
        style={{
          width: '100%',
          height: '170px',
          background: board.thumbnail_base64
            ? `url(${board.thumbnail_base64}) center/cover`
            : 'linear-gradient(145deg, #18181b, #09090b)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          zIndex: 1
        }}
      >
        {!board.thumbnail_base64 && (
          <div style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.1,
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }} />
        )}
        
        {!board.thumbnail_base64 && (
           <div style={{ zIndex: 2, padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(4px)' }}>
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
               <line x1="3" y1="9" x2="21" y2="9"></line>
               <line x1="9" y1="21" x2="9" y2="9"></line>
             </svg>
           </div>
        )}

        {/* Hover actions */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(9, 9, 11, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.2s ease',
            zIndex: 3
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onOpen?.(board.room_id); }}
            style={{
              padding: '10px 20px',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
              transition: 'background 0.2s, transform 0.1s'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <ExternalLink size={16} /> Open Board
          </button>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '18px 20px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
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
                fontSize: '15px',
                fontWeight: 600,
                background: 'rgba(0,0,0,0.2)',
                color: '#ffffff',
                border: '1px solid #8b5cf6',
                borderRadius: '8px',
                padding: '4px 10px',
                outline: 'none',
                flex: 1,
                fontFamily: "'Inter', sans-serif",
                boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.2)'
              }}
            />
          ) : (
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#f4f4f5', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {board.name || 'Untitled Board'}
            </h3>
          )}

          <div style={{ position: 'relative', marginLeft: '12px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              style={{
                border: 'none',
                background: showMenu ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: '#a1a1aa',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                opacity: isHovered || showMenu ? 1 : 0,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={(e) => { if(!showMenu) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a1a1aa'; } }}
            >
              <MoreHorizontal size={18} />
            </button>

            {showMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '4px',
                  background: 'rgba(24, 24, 27, 0.95)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '12px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
                  padding: '6px',
                  zIndex: 100,
                  minWidth: '140px',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => { setEditing(true); setShowMenu(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                    padding: '10px 12px', border: 'none', background: 'transparent',
                    borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#e4e4e7',
                    fontFamily: "'Inter', sans-serif", transition: 'background 0.1s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Edit2 size={14} /> Rename
                </button>
                <button
                  onClick={() => { onDelete?.(board.room_id); setShowMenu(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                    padding: '10px 12px', border: 'none', background: 'transparent',
                    borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#f87171',
                    fontFamily: "'Inter', sans-serif", transition: 'background 0.1s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Edited {timeAgo(board.updated_at)}</span>
          {board.members && board.members.length > 0 && (
            <div style={{ display: 'flex' }}>
              {board.members.slice(0, 3).map((m, i) => (
                <div
                  key={i}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: m.color || `hsl(${Math.random() * 360}, 70%, 50%)`,
                    border: '2px solid #18181b',
                    marginLeft: i > 0 ? '-8px' : 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    fontWeight: 700,
                    color: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                  title={m.name}
                >
                  {(m.name || '?')[0].toUpperCase()}
                </div>
              ))}
              {board.members.length > 3 && (
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%', background: '#27272a',
                  border: '2px solid #18181b', marginLeft: '-8px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '9px', fontWeight: 600, color: '#a1a1aa'
                }}>
                  +{board.members.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
