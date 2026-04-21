// ============================================================
// KanbanBoard — Interactive Kanban component for the whiteboard
// ============================================================

import React from 'react';
import useKanban from '../hooks/useKanban.js';
import KanbanColumn from './KanbanColumn.jsx';

export default function KanbanBoard({ ydoc, currentUser, roomMembers = [] }) {
  const {
    columns,
    addCard,
    moveCard,
    updateCard,
    deleteCard,
    addColumn,
    updateColumn,
    deleteColumn,
    getColumnCards,
  } = useKanban(ydoc);

  return (
    <div
      className="kanban-board-container"
      style={{
        display: 'flex',
        gap: '16px',
        padding: '20px',
        background: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(8px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        minWidth: 'min-content',
        height: '600px', // Fixed height for canvas placement
        boxShadow: '0 8px 32px rgba(0, 10, 30, 0.08)',
        fontFamily: "'Inter', sans-serif",
        overflowX: 'auto',
        overflowY: 'hidden',
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {columns.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          cards={getColumnCards(column.id)}
          onAddCard={addCard}
          onUpdateCard={updateCard}
          onDeleteCard={deleteCard}
          onMoveCard={moveCard}
          onDeleteColumn={deleteColumn}
          onUpdateColumn={updateColumn}
          allColumns={columns}
          roomMembers={roomMembers}
        />
      ))}

      {/* Add Column Button */}
      <button
        onClick={() => addColumn('New Column')}
        style={{
          minWidth: '280px',
          height: '48px',
          background: 'rgba(255, 255, 255, 0.6)',
          border: '1px dashed #cbd5e1',
          borderRadius: '14px',
          color: '#64748b',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#ffffff';
          e.currentTarget.style.borderColor = '#6366f1';
          e.currentTarget.style.color = '#6366f1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)';
          e.currentTarget.style.borderColor = '#cbd5e1';
          e.currentTarget.style.color = '#64748b';
        }}
      >
        <span>+ Add Column</span>
      </button>

      <style>{`
        .kanban-board-container::-webkit-scrollbar {
          height: 8px;
        }
        .kanban-board-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .kanban-board-container::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .kanban-board-container::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
