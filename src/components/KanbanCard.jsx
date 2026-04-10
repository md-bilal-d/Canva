// ============================================================
// KanbanCard — Draggable card component for Kanban board
// ============================================================

import React, { useState } from 'react';
import { Calendar, User, Trash2, X } from 'lucide-react';

function CardDetailModal({ card, onClose, onUpdate, onDelete, roomMembers = [] }) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [dueDate, setDueDate] = useState(card.dueDate || '');
  const [assignee, setAssignee] = useState(card.assignee || '');

  const handleSave = () => {
    onUpdate?.(card.id, { title, description, dueDate: dueDate || null, assignee: assignee || null });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter', sans-serif",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '440px', background: 'white', borderRadius: '16px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.2)', padding: '24px',
          display: 'flex', flexDirection: 'column', gap: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Card Details</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={18} />
          </button>
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              display: 'block', width: '100%', marginTop: '4px',
              padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px',
              fontSize: '14px', outline: 'none', fontFamily: "'Inter', sans-serif",
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={{
              display: 'block', width: '100%', marginTop: '4px',
              padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px',
              fontSize: '13px', outline: 'none', resize: 'none', fontFamily: "'Inter', sans-serif",
            }}
            placeholder="Add a description..."
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Assignee</label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              style={{
                display: 'block', width: '100%', marginTop: '4px',
                padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px',
                fontSize: '13px', outline: 'none', background: 'white',
              }}
            >
              <option value="">Unassigned</option>
              {roomMembers.map((m) => (
                <option key={m.id || m.name} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                display: 'block', width: '100%', marginTop: '4px',
                padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px',
                fontSize: '13px', outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={() => { onDelete?.(card.id); onClose(); }}
            style={{
              padding: '8px 16px', border: 'none', borderRadius: '8px',
              background: '#fef2f2', color: '#ef4444', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <Trash2 size={14} /> Delete
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 20px', border: 'none', borderRadius: '8px',
              background: '#6366f1', color: 'white', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600,
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function KanbanCard({ card, onUpdate, onDelete, roomMembers = [] }) {
  const [detailOpen, setDetailOpen] = useState(false);

  const isDueSoon = card.dueDate && new Date(card.dueDate) <= new Date(Date.now() + 86400000);

  return (
    <>
      <div
        onClick={() => setDetailOpen(true)}
        style={{
          background: 'white',
          borderRadius: '10px',
          padding: '12px 14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          border: '1px solid #f1f5f9',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          fontFamily: "'Inter', sans-serif",
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* Color label bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: card.colorLabel || '#6366f1',
            borderRadius: '10px 10px 0 0',
          }}
        />

        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
          {card.title}
        </div>

        {card.description && (
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', lineHeight: 1.3 }}>
            {card.description.slice(0, 60)}{card.description.length > 60 ? '...' : ''}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
          {/* Assignee */}
          {card.assignee && (
            <div
              style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: '#6366f1', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '9px', fontWeight: 700,
              }}
              title={card.assignee}
            >
              {card.assignee[0].toUpperCase()}
            </div>
          )}
          {/* Due date */}
          {card.dueDate && (
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '10px', fontWeight: 500,
                color: isDueSoon ? '#ef4444' : '#94a3b8',
                background: isDueSoon ? '#fef2f2' : '#f8fafc',
                padding: '2px 8px', borderRadius: '6px',
              }}
            >
              <Calendar size={10} />
              {new Date(card.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>
      </div>

      {detailOpen && (
        <CardDetailModal
          card={card}
          onClose={() => setDetailOpen(false)}
          onUpdate={onUpdate}
          onDelete={onDelete}
          roomMembers={roomMembers}
        />
      )}
    </>
  );
}
