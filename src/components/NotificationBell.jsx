// ============================================================
// NotificationBell — Toolbar bell icon with dropdown list
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const ICONS = {
  join: '👋',
  comment: '💬',
  mention: '📣',
  invite: '✉️',
  default: '🔔',
};

export default function NotificationBell({
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '38px',
          height: '38px',
          border: 'none',
          borderRadius: '10px',
          background: open ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
          color: open ? '#6366f1' : 'rgba(255,255,255,0.6)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.15s ease',
        }}
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#ef4444',
              color: 'white',
              fontSize: '9px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(24,24,32,0.9)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            left: '100%',
            top: 0,
            marginLeft: '8px',
            width: '320px',
            maxHeight: '400px',
            background: 'white',
            borderRadius: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            fontFamily: "'Inter', sans-serif",
            zIndex: 9999,
            animation: 'notifIn 0.15s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid #f1f5f9',
              background: '#fafbfc',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={() => onMarkAllRead?.()}
                style={{
                  fontSize: '11px',
                  color: '#6366f1',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '340px', overflow: 'auto' }}>
            {notifications.length === 0 && (
              <div
                style={{
                  padding: '32px',
                  textAlign: 'center',
                  color: '#9ca3af',
                  fontSize: '13px',
                }}
              >
                No notifications yet
              </div>
            )}
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.read && onMarkRead?.(notif.id)}
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  cursor: notif.read ? 'default' : 'pointer',
                  background: notif.read ? 'transparent' : '#fafbff',
                  borderBottom: '1px solid #f8fafc',
                  transition: 'background 0.15s ease',
                }}
              >
                {/* Icon */}
                <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '2px' }}>
                  {ICONS[notif.type] || ICONS.default}
                </span>
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: '13px',
                      color: '#374151',
                      margin: 0,
                      lineHeight: 1.4,
                      fontWeight: notif.read ? 400 : 500,
                    }}
                  >
                    {notif.message}
                  </p>
                  <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                    {timeAgo(notif.created_at || notif.timestamp || Date.now())}
                  </span>
                </div>
                {/* Unread dot */}
                {!notif.read && (
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#6366f1',
                      flexShrink: 0,
                      marginTop: '6px',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes notifIn {
          from { opacity: 0; transform: translateX(-4px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
