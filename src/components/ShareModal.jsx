// ============================================================
// ShareModal — Board sharing & privacy controls
// ============================================================

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Lock, Link2, Globe, UserPlus, Trash2 } from 'lucide-react';

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private', desc: 'Only invited members', icon: Lock, color: '#ef4444' },
  { value: 'link', label: 'Anyone with link', desc: 'Can view', icon: Link2, color: '#f59e0b' },
  { value: 'public', label: 'Public', desc: 'Anyone can find and edit', icon: Globe, color: '#22c55e' },
];

export default function ShareModal({
  isOpen,
  onClose,
  settings,
  onUpdateVisibility,
  onInviteMember,
  onRemoveMember,
  loading,
}) {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [visibility, setVisibility] = useState(settings?.visibility || 'link');

  useEffect(() => {
    if (settings?.visibility) setVisibility(settings.visibility);
  }, [settings?.visibility]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    onInviteMember?.(email.trim());
    setEmail('');
  };

  const handleVisibilityChange = (val) => {
    setVisibility(val);
    onUpdateVisibility?.(val);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', sans-serif",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '460px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          animation: 'modalIn 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Share Board
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              border: 'none',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Visibility */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Visibility
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              {VISIBILITY_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = visibility === opt.value;
                return (
                  <label
                    key={opt.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `1.5px solid ${isActive ? opt.color : '#e2e8f0'}`,
                      background: isActive ? `${opt.color}08` : '#fafbfc',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onClick={() => handleVisibilityChange(opt.value)}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={opt.value}
                      checked={isActive}
                      readOnly
                      style={{ display: 'none' }}
                    />
                    <Icon size={18} color={isActive ? opt.color : '#94a3b8'} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{opt.label}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{opt.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Copy link */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Board Link
            </label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <div
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  background: '#f1f5f9',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#64748b',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {window.location.href}
              </div>
              <button
                onClick={handleCopy}
                style={{
                  padding: '9px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#6366f1',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Invite */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Invite by Email
            </label>
            <form onSubmit={handleInvite} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '9px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#0f172a',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                <UserPlus size={14} />
                Send Invite
              </button>
            </form>
          </div>

          {/* Members list */}
          {settings?.members?.length > 0 && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Members ({settings.members.length})
              </label>
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {settings.members.map((member) => (
                  <div
                    key={member.id || member.email}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#fafbfc',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: '#6366f1',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        {(member.name || member.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>
                          {member.name || member.email}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>{member.role || 'editor'}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveMember?.(member.id || member.email)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
