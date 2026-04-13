// ============================================================
// HomePage — "My Boards" dashboard (Premium Dark Mode)
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, Sparkles, LayoutGrid } from 'lucide-react';
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
        background: '#09090b', // Deep zinc
        backgroundImage: 'radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.08), transparent 25%), radial-gradient(circle at 85% 30%, rgba(168, 85, 247, 0.08), transparent 25%)',
        overflow: 'auto',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#f8fafc'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 40px',
          background: 'rgba(9, 9, 11, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <Sparkles size={20} color="white" />
          </div>
          <div>
             <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, background: 'linear-gradient(to right, #ffffff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
               Workspace
             </h1>
             <span style={{ fontSize: '12px', color: '#71717a', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Collaborative Canvas</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* User info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 16px 6px 6px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(to bottom right, #3b82f6, #8b5cf6)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)'
              }}
            >
              {(currentUser?.name || '?')[0].toUpperCase()}
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#e4e4e7' }}>
              {currentUser?.name || 'Guest'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              color: '#a1a1aa',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
              e.currentTarget.style.color = '#a1a1aa';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            }}
          >
            <LogOut size={16} /> <span style={{display: 'none', '@media (min-width: 600px)': {display: 'inline'}}}>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '48px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LayoutGrid size={24} color="#8b5cf6" />
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#ffffff', margin: 0 }}>Recent Boards</h2>
          </div>

          {/* New Board button */}
          <button
            onClick={handleNewBoard}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 28px',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #4f46e5, #9333ea)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              boxShadow: '0 8px 24px rgba(147, 51, 234, 0.25)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(147, 51, 234, 0.4)';
              e.currentTarget.style.filter = 'brightness(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(147, 51, 234, 0.25)';
              e.currentTarget.style.filter = 'brightness(1)';
            }}
          >
            <Plus size={20} /> Create New
          </button>
        </div>

        {/* Boards grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '3px solid rgba(255,255,255,0.1)', 
              borderTopColor: '#8b5cf6', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite' 
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : boards.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '100px 40px',
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.02), rgba(255,255,255,0))',
              borderRadius: '24px',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Glow orb in the center */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '200px', height: '200px', background: 'rgba(139, 92, 246, 0.15)', filter: 'blur(60px)', borderRadius: '50%', zIndex: 0 }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '56px', marginBottom: '24px', filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.3))' }}>✨</div>
              <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
                Your canvas is empty
              </h3>
              <p style={{ fontSize: '16px', color: '#a1a1aa', maxWidth: '400px', margin: '0 auto' }}>
                Create your first board to start collaborating, ideating, and building with your team in real-time.
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
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
