// CADCommandBar.jsx — AutoCAD-style bottom command line bar
import React, { useState, useRef, useEffect, useCallback } from 'react';

const COMMAND_ALIASES = {
  L: 'line',
  PL: 'polyline',
  REC: 'rectangle',
  C: 'circle',
  A: 'arc',
  POL: 'polygon',
  T: 'text',
  M: 'move',
  RO: 'rotate',
  SC: 'scale',
  MI: 'mirror',
  TR: 'trim',
  EX: 'extend',
  O: 'offset',
  F: 'fillet',
  CHA: 'chamfer',
  AR: 'array',
  X: 'explode',
  DLI: 'dim_linear',
  DAL: 'dim_aligned',
  DRA: 'dim_radius',
  DDI: 'dim_diameter',
  DAN: 'dim_angle',
  LE: 'leader',
  CL: 'centerline',
  H: 'hatch',
  U: 'undo',
  REDO: 'redo',
  ERASE: 'delete',
  DEL: 'delete',
  COPY: 'copy',
  SELECT: 'select',
  Z: 'zoom',
};

export default function CADCommandBar({
  hint,
  activeTool,
  onCommand,
  onToolChange,
  onValueSubmit,
  onCancel,
}) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const inputRef = useRef(null);
  const historyContainerRef = useRef(null);

  // Auto-scroll history
  useEffect(() => {
    if (historyContainerRef.current) {
      historyContainerRef.current.scrollTop = historyContainerRef.current.scrollHeight;
    }
  }, [history]);

  const pushHistory = useCallback((text, type = 'input') => {
    setHistory(prev => [...prev.slice(-100), { text, type, time: Date.now() }]);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setInput('');
      onCancel?.();
      pushHistory('*Cancel*', 'system');
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const val = input.trim();
      if (!val) {
        onValueSubmit?.('Enter', '');
        return;
      }

      pushHistory(`> ${val}`, 'input');

      // Check if it's a command alias
      const cmdKey = val.toUpperCase();
      const toolName = COMMAND_ALIASES[cmdKey];
      if (toolName) {
        if (toolName === 'undo') {
          onCommand?.('undo');
          pushHistory('Undo', 'system');
        } else if (toolName === 'redo') {
          onCommand?.('redo');
          pushHistory('Redo', 'system');
        } else if (toolName === 'delete') {
          onCommand?.('delete');
          pushHistory('Delete selected', 'system');
        } else {
          onToolChange?.(toolName);
          pushHistory(`Tool: ${toolName}`, 'system');
        }
      } else {
        // Try as numeric value for active tool
        const numVal = parseFloat(val);
        if (!isNaN(numVal)) {
          onValueSubmit?.('Enter', val);
          pushHistory(`Value: ${val}`, 'value');
        } else {
          // Try as full command name
          const lower = val.toLowerCase();
          if (COMMAND_ALIASES[val.toUpperCase()] || Object.values(COMMAND_ALIASES).includes(lower)) {
            const mapped = COMMAND_ALIASES[val.toUpperCase()] || lower;
            onToolChange?.(mapped);
            pushHistory(`Tool: ${mapped}`, 'system');
          } else {
            onValueSubmit?.('Enter', val);
            pushHistory(`Input: ${val}`, 'value');
          }
        }
      }

      setInput('');
      setHistoryIdx(-1);
      return;
    }

    // History navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const inputHistory = history.filter(h => h.type === 'input');
      if (inputHistory.length > 0) {
        const idx = historyIdx < 0 ? inputHistory.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(idx);
        setInput(inputHistory[idx]?.text.replace(/^>\s*/, '') || '');
      }
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const inputHistory = history.filter(h => h.type === 'input');
      if (historyIdx >= 0) {
        const idx = historyIdx + 1;
        if (idx >= inputHistory.length) {
          setHistoryIdx(-1);
          setInput('');
        } else {
          setHistoryIdx(idx);
          setInput(inputHistory[idx]?.text.replace(/^>\s*/, '') || '');
        }
      }
    }
  }, [input, history, historyIdx, onCommand, onToolChange, onValueSubmit, onCancel, pushHistory]);

  // Focus on click anywhere in bar
  const handleBarClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div style={styles.container} onClick={handleBarClick}>
      {/* History */}
      <div style={styles.historyContainer} ref={historyContainerRef}>
        {history.slice(-20).map((entry, i) => (
          <div key={i} style={{
            ...styles.historyLine,
            color: entry.type === 'system' ? '#8b949e'
              : entry.type === 'value' ? '#79c0ff'
              : '#3fb950',
          }}>
            {entry.text}
          </div>
        ))}
      </div>

      {/* Current prompt + input */}
      <div style={styles.inputRow}>
        <span style={styles.prompt}>
          {hint || `[${activeTool?.toUpperCase() || 'SELECT'}]`}
        </span>
        <span style={styles.chevron}>❯</span>
        <input
          ref={inputRef}
          type="text"
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type command or value..."
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    bottom: 0,
    left: 52,
    right: 240,
    height: 'auto',
    maxHeight: 180,
    backgroundColor: '#0d1117',
    borderTop: '1px solid #30363d',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
    cursor: 'text',
  },
  historyContainer: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    maxHeight: 120,
    padding: '4px 12px 0',
    scrollbarWidth: 'thin',
    scrollbarColor: '#21262d #0d1117',
  },
  historyLine: {
    fontSize: 12,
    lineHeight: '18px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 12px 6px',
    gap: 6,
    minHeight: 28,
  },
  prompt: {
    color: '#ffa657',
    fontSize: 11,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  chevron: {
    color: '#3fb950',
    fontSize: 12,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#3fb950',
    fontSize: 13,
    fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
    caretColor: '#3fb950',
    padding: 0,
  },
};
