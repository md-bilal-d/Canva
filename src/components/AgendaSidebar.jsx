// ============================================================
// AgendaSidebar — Meeting agenda + notes sidebar
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Plus, Trash2, Play, CheckCircle2, Clock, Download, GripVertical } from 'lucide-react';

function AgendaItem({ item, isCurrent, onStart, onRemove, remaining }) {
  const statusColors = { pending: '#94a3b8', current: '#6366f1', done: '#22c55e' };
  const statusIcon = {
    pending: <Clock size={14} color="#94a3b8" />,
    current: <Play size={14} color="#6366f1" />,
    done: <CheckCircle2 size={14} color="#22c55e" />,
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        background: isCurrent ? '#f0f0ff' : 'white',
        borderRadius: '10px',
        border: `1.5px solid ${isCurrent ? '#6366f1' : '#f1f5f9'}`,
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ cursor: 'grab', color: '#d1d5db' }}>
        <GripVertical size={14} />
      </div>
      {statusIcon[item.status]}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{item.title}</div>
        <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', gap: '8px', marginTop: '2px' }}>
          <span>{item.duration} min</span>
          {item.ownerName && <span>• {item.ownerName}</span>}
          {isCurrent && remaining !== null && (
            <span style={{ color: remaining < 60000 ? '#ef4444' : '#6366f1', fontWeight: 600 }}>
              {Math.ceil(remaining / 1000)}s left
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '4px' }}>
        {item.status === 'pending' && (
          <button
            onClick={() => onStart?.(item.id)}
            style={{
              width: '28px', height: '28px', border: 'none', borderRadius: '6px',
              background: '#eef2ff', color: '#6366f1', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Start"
          >
            <Play size={12} />
          </button>
        )}
        <button
          onClick={() => onRemove?.(item.id)}
          style={{
            width: '28px', height: '28px', border: 'none', borderRadius: '6px',
            background: 'transparent', color: '#d1d5db', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="Remove"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export default function AgendaSidebar({
  isOpen,
  onClose,
  items = [],
  notes = '',
  currentItemId,
  onAddItem,
  onRemoveItem,
  onSetCurrentItem,
  onUpdateNotes,
  onExportNotes,
  currentUser,
}) {
  const [tab, setTab] = useState('agenda');
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState(5);
  const [remaining, setRemaining] = useState(null);
  const notesRef = useRef(null);

  // Calculate remaining time for current agenda item
  useEffect(() => {
    const current = items.find((i) => i.id === currentItemId);
    if (!current || !current.startedAt) {
      setRemaining(null);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - current.startedAt;
      const rem = Math.max(0, current.duration * 60 * 1000 - elapsed);
      setRemaining(rem);

      if (rem <= 0) {
        // Play sound when time is up
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.5);
          setTimeout(() => ctx.close(), 600);
        } catch (e) {}
      }
    }, 500);

    return () => clearInterval(interval);
  }, [currentItemId, items]);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddItem?.({
      title: newTitle.trim(),
      duration: newDuration,
      ownerId: currentUser?.id,
      ownerName: currentUser?.name,
    });
    setNewTitle('');
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: '360px',
        background: 'white',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
        zIndex: 9000,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', sans-serif",
        animation: 'slideInRight 0.2s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
          📋 Meeting
        </h2>
        <button
          onClick={onClose}
          style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
        {['agenda', 'notes'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderBottom: tab === t ? '2px solid #6366f1' : '2px solid transparent',
              background: 'transparent',
              color: tab === t ? '#6366f1' : '#94a3b8',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              textTransform: 'capitalize',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'agenda' && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map((item) => (
              <AgendaItem
                key={item.id}
                item={item}
                isCurrent={item.id === currentItemId}
                onStart={onSetCurrentItem}
                onRemove={onRemoveItem}
                remaining={item.id === currentItemId ? remaining : null}
              />
            ))}

            {/* Add item form */}
            <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Agenda item..."
                style={{
                  flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0',
                  borderRadius: '8px', fontSize: '13px', outline: 'none',
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              <input
                type="number"
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                min={1}
                max={120}
                style={{
                  width: '50px', padding: '8px', border: '1px solid #e2e8f0',
                  borderRadius: '8px', fontSize: '13px', outline: 'none', textAlign: 'center',
                }}
                title="Minutes"
              />
              <button
                type="submit"
                style={{
                  width: '36px', height: '36px', border: 'none', borderRadius: '8px',
                  background: '#6366f1', color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Plus size={16} />
              </button>
            </form>
          </div>
        )}

        {tab === 'notes' && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
            <textarea
              ref={notesRef}
              value={notes}
              onChange={(e) => onUpdateNotes?.(e.target.value)}
              placeholder="Shared meeting notes..."
              style={{
                flex: 1, padding: '14px', border: '1px solid #e2e8f0',
                borderRadius: '10px', fontSize: '13px', outline: 'none',
                resize: 'none', fontFamily: "'Inter', sans-serif",
                lineHeight: 1.6, minHeight: '300px',
              }}
            />
            <button
              onClick={onExportNotes}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '10px', border: '1px solid #e2e8f0', borderRadius: '10px',
                background: 'white', color: '#64748b', cursor: 'pointer',
                fontSize: '13px', fontWeight: 500, fontFamily: "'Inter', sans-serif",
              }}
            >
              <Download size={14} /> Export Notes
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
