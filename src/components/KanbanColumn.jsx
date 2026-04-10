// ============================================================
// KanbanColumn — Droppable column for Kanban board
// ============================================================

import React, { useState, useCallback } from 'react';
import { Plus, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import KanbanCard from './KanbanCard.jsx';

export default function KanbanColumn({
  column,
  cards = [],
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onMoveCard,
  onDeleteColumn,
  onUpdateColumn,
  roomMembers = [],
  allColumns = [],
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleTitleSave = useCallback(() => {
    setEditingTitle(false);
    if (titleValue.trim() && titleValue !== column.title) {
      onUpdateColumn?.(column.id, { title: titleValue.trim() });
    }
  }, [titleValue, column, onUpdateColumn]);

  const handleAddCard = useCallback(() => {
    onAddCard?.({
      title: 'New Card',
      columnId: column.id,
    });
  }, [column.id, onAddCard]);

  // Simple drag & drop via HTML5
  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/cardId');
    if (cardId) {
      onMoveCard?.(cardId, column.id, Date.now());
    }
    setDragOverIndex(null);
  }, [column.id, onMoveCard]);

  const handleDragStart = useCallback((e, cardId) => {
    e.dataTransfer.setData('text/cardId', cardId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  return (
    <div
      style={{
        width: '280px',
        minWidth: '280px',
        background: '#f8fafc',
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%',
        fontFamily: "'Inter', sans-serif",
        border: '1px solid #e2e8f0',
      }}
      onDragOver={(e) => handleDragOver(e, cards.length)}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px 10px',
        }}
      >
        {editingTitle ? (
          <input
            autoFocus
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSave();
              if (e.key === 'Escape') setEditingTitle(false);
            }}
            style={{
              fontSize: '14px',
              fontWeight: 700,
              border: '1px solid #6366f1',
              borderRadius: '6px',
              padding: '2px 8px',
              outline: 'none',
              flex: 1,
              fontFamily: "'Inter', sans-serif",
            }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3
              style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}
              onDoubleClick={() => setEditingTitle(true)}
            >
              {column.title}
            </h3>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#94a3b8',
                background: '#e2e8f0',
                padding: '1px 8px',
                borderRadius: '10px',
              }}
            >
              {cards.length}
            </span>
          </div>
        )}

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
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
                minWidth: '140px',
              }}
            >
              <button
                onClick={() => { setEditingTitle(true); setShowMenu(false); }}
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
                onClick={() => { onDeleteColumn?.(column.id); setShowMenu(false); }}
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

      {/* Cards */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '0 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          minHeight: '60px',
        }}
      >
        {cards.map((card, index) => (
          <div
            key={card.id}
            draggable
            onDragStart={(e) => handleDragStart(e, card.id)}
            onDragOver={(e) => handleDragOver(e, index)}
            style={{
              opacity: dragOverIndex === index ? 0.5 : 1,
            }}
          >
            <KanbanCard
              card={card}
              onUpdate={onUpdateCard}
              onDelete={onDeleteCard}
              roomMembers={roomMembers}
            />
          </div>
        ))}
      </div>

      {/* Add Card button */}
      <div style={{ padding: '10px' }}>
        <button
          onClick={handleAddCard}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px dashed #d1d5db',
            borderRadius: '10px',
            background: 'transparent',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
            fontFamily: "'Inter', sans-serif",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#94a3b8'; }}
        >
          <Plus size={14} /> Add Card
        </button>
      </div>
    </div>
  );
}
