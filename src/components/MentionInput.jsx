// ============================================================
// MentionInput — Textarea with @mention autocomplete
// ============================================================

import React, { useState, useRef, useCallback, useEffect } from 'react';

export default function MentionInput({
  value,
  onChange,
  onSubmit,
  roomMembers = [],
  placeholder = 'Type a message...',
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const textareaRef = useRef(null);

  const filteredMembers = roomMembers.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleInput = useCallback(
    (e) => {
      const text = e.target.value;
      onChange?.(text);

      // Detect @mention trigger
      const cursorPos = e.target.selectionStart;
      const textBeforeCursor = text.slice(0, cursorPos);
      const atIndex = textBeforeCursor.lastIndexOf('@');

      if (atIndex !== -1) {
        const charBefore = atIndex > 0 ? textBeforeCursor[atIndex - 1] : ' ';
        const queryText = textBeforeCursor.slice(atIndex + 1);

        // Only trigger if @ is at start or preceded by whitespace, and no space in query
        if ((charBefore === ' ' || charBefore === '\n' || atIndex === 0) && !queryText.includes(' ')) {
          setShowDropdown(true);
          setQuery(queryText);
          setMentionStart(atIndex);
          setSelectedIndex(0);
          return;
        }
      }

      setShowDropdown(false);
      setQuery('');
      setMentionStart(-1);
    },
    [onChange]
  );

  const insertMention = useCallback(
    (member) => {
      const textarea = textareaRef.current;
      if (!textarea || mentionStart === -1) return;

      const cursorPos = textarea.selectionStart;
      const before = value.slice(0, mentionStart);
      const after = value.slice(cursorPos);
      const newText = `${before}@${member.name} ${after}`;

      onChange?.(newText);
      setShowDropdown(false);
      setQuery('');
      setMentionStart(-1);

      // Move cursor after mention
      setTimeout(() => {
        const newPos = mentionStart + member.name.length + 2;
        textarea.selectionStart = newPos;
        textarea.selectionEnd = newPos;
        textarea.focus();
      }, 0);
    },
    [value, mentionStart, onChange]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (showDropdown && filteredMembers.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filteredMembers.length - 1));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          insertMention(filteredMembers[selectedIndex]);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowDropdown(false);
          return;
        }
      }

      // Submit on Enter (without shift)
      if (e.key === 'Enter' && !e.shiftKey && !showDropdown) {
        e.preventDefault();
        onSubmit?.();
      }
    },
    [showDropdown, filteredMembers, selectedIndex, insertMention, onSubmit]
  );

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={2}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          fontSize: '13px',
          fontFamily: "'Inter', sans-serif",
          resize: 'none',
          outline: 'none',
          lineHeight: 1.5,
          background: '#fafbfc',
          transition: 'border-color 0.15s ease',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
        onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
      />

      {/* Dropdown */}
      {showDropdown && filteredMembers.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            background: 'white',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid #e2e8f0',
            maxHeight: '160px',
            overflow: 'auto',
            marginBottom: '4px',
            zIndex: 100,
          }}
        >
          {filteredMembers.map((member, i) => (
            <div
              key={member.id || member.name}
              onClick={() => insertMention(member)}
              style={{
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                background: i === selectedIndex ? '#f0f0ff' : 'transparent',
                transition: 'background 0.1s ease',
              }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: member.color || '#6366f1',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                }}
              >
                {(member.name || '?')[0].toUpperCase()}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#1e293b' }}>
                {member.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
