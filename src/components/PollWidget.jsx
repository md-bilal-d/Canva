// ============================================================
// PollWidget — Collaborative voting/polling widget
// ============================================================

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, BarChart3, Check, Eye, EyeOff } from 'lucide-react';

function PollCreationModal({ onClose, onCreate }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [timerMinutes, setTimerMinutes] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  const addOption = () => {
    if (options.length < 6) setOptions([...options, '']);
  };

  const updateOption = (i, val) => {
    const next = [...options];
    next[i] = val;
    setOptions(next);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const validOptions = options.filter((o) => o.trim());
    if (!question.trim() || validOptions.length < 2) return;
    onCreate({
      question: question.trim(),
      options: validOptions,
      timerMinutes: timerMinutes ? Number(timerMinutes) : null,
      anonymous,
    });
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
      <form
        onSubmit={handleCreate}
        style={{
          width: '400px', background: 'white', borderRadius: '16px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.2)', padding: '24px',
          display: 'flex', flexDirection: 'column', gap: '16px',
          animation: 'modalIn 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Create Poll</h3>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={18} />
          </button>
        </div>

        <input
          autoFocus
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What's your question?"
          style={{
            padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '10px',
            fontSize: '14px', outline: 'none', fontFamily: "'Inter', sans-serif",
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Options</label>
          {options.map((opt, i) => (
            <input
              key={i}
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              style={{
                padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px',
                fontSize: '13px', outline: 'none', fontFamily: "'Inter', sans-serif",
              }}
            />
          ))}
          {options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              style={{
                padding: '6px', border: '1px dashed #d1d5db', borderRadius: '8px',
                background: 'transparent', color: '#94a3b8', cursor: 'pointer',
                fontSize: '12px', fontWeight: 500,
              }}
            >
              + Add Option
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Timer (min)</label>
            <input
              type="number"
              value={timerMinutes}
              onChange={(e) => setTimerMinutes(e.target.value)}
              placeholder="Optional"
              min={1}
              max={60}
              style={{
                display: 'block', width: '100%', marginTop: '4px',
                padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px',
                fontSize: '13px', outline: 'none',
              }}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginTop: '18px' }}>
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Anonymous</span>
          </label>
        </div>

        <button
          type="submit"
          style={{
            padding: '10px', border: 'none', borderRadius: '10px',
            background: '#6366f1', color: 'white', fontWeight: 600,
            fontSize: '14px', cursor: 'pointer',
          }}
        >
          Create Poll
        </button>
      </form>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function PollWidget({
  poll,
  currentUserId,
  totalUsers = 1,
  onVote,
  onClose,
  onDelete,
  getVoteCount,
  getTotalVotes,
}) {
  const [position, setPosition] = useState({ x: poll?.x || 200, y: poll?.y || 200 });
  const dragStartRef = useRef(null);

  const handleDragStart = useCallback((e) => {
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    const handleDrag = (e) => {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    };
    const handleDragEnd = () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', handleDragEnd);
  }, [position]);

  if (!poll) return null;

  const totalVotes = getTotalVotes?.(poll) || 0;
  const userVote = poll.votes?.[currentUserId];
  const isClosed = poll.closed;

  // Find winning option
  let winnerOptId = null;
  if (isClosed && poll.options?.length > 0) {
    let max = 0;
    poll.options.forEach((opt) => {
      const count = getVoteCount?.(poll, opt.id) || 0;
      if (count > max) {
        max = count;
        winnerOptId = opt.id;
      }
    });
  }

  // Auto-close check
  const [timeLeft, setTimeLeft] = useState(null);
  useEffect(() => {
    if (!poll.endsAt || isClosed) return;
    const interval = setInterval(() => {
      const rem = Math.max(0, poll.endsAt - Date.now());
      setTimeLeft(rem);
    }, 1000);
    return () => clearInterval(interval);
  }, [poll.endsAt, isClosed]);

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 8000,
        width: '300px',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        border: '1px solid #e2e8f0',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        onMouseDown={handleDragStart}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: '#fafbfc', borderBottom: '1px solid #f1f5f9',
          cursor: 'grab', userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={16} color="#6366f1" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Poll</span>
          {poll.anonymous && <EyeOff size={12} color="#94a3b8" title="Anonymous" />}
        </div>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>

      {/* Question */}
      <div style={{ padding: '14px 16px 8px' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0, lineHeight: 1.4 }}>
          {poll.question}
        </p>
        {timeLeft !== null && !isClosed && (
          <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 500 }}>
            ⏰ {Math.ceil(timeLeft / 1000)}s remaining
          </span>
        )}
      </div>

      {/* Options */}
      <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {(poll.options || []).map((opt) => {
          const count = getVoteCount?.(poll, opt.id) || 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isSelected = userVote === opt.id;
          const isWinner = isClosed && opt.id === winnerOptId;

          return (
            <button
              key={opt.id}
              onClick={() => !isClosed && onVote?.(poll.id, opt.id)}
              disabled={isClosed}
              style={{
                position: 'relative',
                padding: '10px 14px',
                border: `1.5px solid ${isSelected ? '#6366f1' : isWinner ? '#22c55e' : '#e2e8f0'}`,
                borderRadius: '10px',
                background: 'transparent',
                cursor: isClosed ? 'default' : 'pointer',
                textAlign: 'left',
                overflow: 'hidden',
                transition: 'all 0.15s ease',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {/* Progress bar background */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${pct}%`,
                  background: isWinner ? 'rgba(34,197,94,0.12)' : isSelected ? 'rgba(99,102,241,0.08)' : 'rgba(0,0,0,0.03)',
                  transition: 'width 0.3s ease',
                  borderRadius: '8px',
                }}
              />
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isSelected && <Check size={13} color="#6366f1" />}
                  <span style={{ fontSize: '13px', fontWeight: isSelected ? 600 : 400, color: '#0f172a' }}>
                    {opt.text}
                  </span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: isWinner ? '#22c55e' : '#94a3b8' }}>
                  {pct}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '0 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        </span>
        {isClosed && (
          <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>✓ Closed</span>
        )}
      </div>
    </div>
  );
}

export { PollCreationModal };
