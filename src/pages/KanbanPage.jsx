// ============================================================
// KanbanPage — Separate Kanban board view
// ============================================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Y from 'yjs';
import { io } from 'socket.io-client';
import { ArrowLeft, Plus, Columns3 } from 'lucide-react';
import useKanban from '../hooks/useKanban.js';
import KanbanColumn from '../components/KanbanColumn.jsx';
import useCurrentUser from '../hooks/useCurrentUser.js';

const SERVER_URL = import.meta.env.VITE_WS_URL || 'http://localhost:1234';

export default function KanbanPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const currentUserData = useCurrentUser();

  const [connected, setConnected] = useState(false);
  const ydocRef = useRef(null);
  const socketRef = useRef(null);
  const [activeDoc, setActiveDoc] = useState(null);

  // Setup Yjs + Socket.io (shared doc with whiteboard)
  useEffect(() => {
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    setActiveDoc(ydoc);

    const socket = io(SERVER_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-room', roomId);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('yjs-sync', (stateBase64) => {
      const state = new Uint8Array(atob(stateBase64).split('').map(c => c.charCodeAt(0)));
      Y.applyUpdate(ydoc, state);
    });

    socket.on('yjs-update', (updateBase64) => {
      const update = new Uint8Array(atob(updateBase64).split('').map(c => c.charCodeAt(0)));
      Y.applyUpdate(ydoc, update, 'remote');
    });

    ydoc.on('update', (update, origin) => {
      if (origin === 'local') {
        const base64 = btoa(String.fromCharCode(...update));
        socket.emit('yjs-update', base64);
      }
    });

    return () => {
      socket.disconnect();
      ydoc.destroy();
    };
  }, [roomId]);

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
  } = useKanban(activeDoc);

  const currentUser = useMemo(() => {
    if (currentUserData) return currentUserData;
    return { id: 'guest', name: 'Guest' };
  }, [currentUserData]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          background: 'white',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate(`/${roomId}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              background: 'white',
              color: '#374151',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <ArrowLeft size={16} /> Back to Whiteboard
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Columns3 size={20} color="#6366f1" />
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              Kanban Board
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: connected ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${connected ? '#bbf7d0' : '#fecaca'}`,
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: connected ? '#22c55e' : '#ef4444',
              }}
            />
            <span style={{ fontSize: '12px', fontWeight: 500, color: connected ? '#166534' : '#991b1b' }}>
              {connected ? 'Synced' : 'Offline'}
            </span>
          </div>

          <button
            onClick={() => addColumn('New Column')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '10px',
              background: '#6366f1',
              color: 'white',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <Plus size={16} /> Add Column
          </button>
        </div>
      </div>

      {/* Board */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: '16px',
          padding: '24px',
          overflow: 'auto',
          alignItems: 'flex-start',
        }}
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
            roomMembers={[currentUser]}
          />
        ))}

        {columns.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
            <Columns3 size={48} color="#d1d5db" />
            <p style={{ fontSize: '16px', color: '#94a3b8' }}>No columns yet. Add one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
