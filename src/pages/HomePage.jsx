// ============================================================
// HomePage — "My Boards" dashboard
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, Sparkles } from 'lucide-react';
import BoardCard from '../components/BoardCard.jsx';
import useCurrentUser from '../hooks/useCurrentUser.js';
import { useAuth } from '../AuthContext.jsx';

const SERVER_URL = import.meta.env.VITE_WS_URL || 'http://localhost:1234';

function generateRoomId() {
  return 'room-' + Math.random().toString(36).substring(2, 10);
}

export default function HomePage() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const { logout } = useAuth();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = currentUser?.id || 'guest';

  const fetchBoards = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/boards?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        setBoards(Array.isArray(data) ? data : []);
      }
    } catch {
      // Server might not have boards endpoint yet
      setBoards([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleNewBoard = useCallback(async () => {
    const roomId = generateRoomId();
    // Register the board on the server
    try {
      await fetch(`${SERVER_URL}/api/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          owner_id: userId,
          name: 'Untitled Board',
        }),
      });
    } catch {
      // Navigate anyway, server will handle it
    }
    navigate(`/${roomId}`);
  }, [navigate, userId]);

  const handleOpen = useCallback((roomId) => {
    navigate(`/${roomId}`);
  }, [navigate]);

  const handleRename = useCallback(async (roomId, name) => {
    try {
      await fetch(`${SERVER_URL}/api/boards/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      setBoards((prev) =>
        prev.map((b) => (b.room_id === roomId ? { ...b, name } : b))
      );
    } catch {
      // Silently ignore
    }
  }, []);

  const handleDelete = useCallback(async (roomId) => {
    try {
      await fetch(`${SERVER_URL}/api/boards/${roomId}`, { method: 'DELETE' });
      setBoards((prev) => prev.filter((b) => b.room_id !== roomId));
    } catch {
      // Silently ignore
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Clear session storage for guest
      sessionStorage.clear();
    }
    navigate('/login');
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#f8fafc',
        overflow: 'auto',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 40px',
          background: 'white',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={18} color="white" />
          </div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
            My Boards
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* User info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              background: '#f8fafc',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#6366f1',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 700,
              }}
            >
              {(currentUser?.name || '?')[0].toUpperCase()}
            </div>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
              {currentUser?.name || 'Guest'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              background: 'white',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '32px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* New Board button */}
        <button
          onClick={handleNewBoard}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 28px',
            border: 'none',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 700,
            fontFamily: "'Inter', sans-serif",
            boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
            marginBottom: '32px',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.3)';
          }}
        >
          <Plus size={20} /> New Board
        </button>

        {/* Boards grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
            Loading boards...
          </div>
        ) : boards.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 40px',
              background: 'white',
              borderRadius: '20px',
              border: '1px dashed #d1d5db',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎨</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              No boards yet
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              Click "New Board" to create your first collaborative whiteboard.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '20px',
            }}
          >
            {boards.map((board) => (
              <BoardCard
                key={board.room_id || board.id}
                board={board}
                onOpen={handleOpen}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
