// ============================================================
// MentionMessage — Chat message renderer with @mention highlights
// ============================================================

import React, { useMemo } from 'react';

/**
 * Renders a chat message, highlighting @Username mentions.
 * If the mention matches the current user: yellow highlight.
 * Otherwise: blue bold text.
 */
export default function MentionMessage({ message, currentUserName }) {
  const parts = useMemo(() => {
    if (!message?.text) return [];

    const regex = /(@\S+)/g;
    const result = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(message.text)) !== null) {
      // Text before the mention
      if (match.index > lastIndex) {
        result.push({
          type: 'text',
          content: message.text.slice(lastIndex, match.index),
        });
      }

      const mentionName = match[1].slice(1); // Remove @
      const isSelf = currentUserName && mentionName.toLowerCase() === currentUserName.toLowerCase();

      result.push({
        type: 'mention',
        content: match[1],
        isSelf,
      });

      lastIndex = match.index + match[0].length;
    }

    // Remaining text
    if (lastIndex < message.text.length) {
      result.push({
        type: 'text',
        content: message.text.slice(lastIndex),
      });
    }

    return result;
  }, [message?.text, currentUserName]);

  const timeStr = message?.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      style={{
        padding: '6px 0',
        fontSize: '13px',
        lineHeight: 1.5,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Sender name + time */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '2px' }}>
        <span style={{ fontWeight: 600, fontSize: '12px', color: message?.color || '#6366f1' }}>
          {message?.userName || 'Anonymous'}
        </span>
        <span style={{ fontSize: '10px', color: '#9ca3af' }}>{timeStr}</span>
      </div>

      {/* Message with mentions */}
      <div style={{ color: '#374151', wordBreak: 'break-word' }}>
        {parts.map((part, i) => {
          if (part.type === 'mention') {
            return (
              <span
                key={i}
                style={{
                  fontWeight: 700,
                  color: part.isSelf ? '#92400e' : '#4f46e5',
                  background: part.isSelf ? '#fef3c7' : '#eef2ff',
                  padding: '1px 4px',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                {part.content}
              </span>
            );
          }
          return <span key={i}>{part.content}</span>;
        })}
      </div>
    </div>
  );
}
