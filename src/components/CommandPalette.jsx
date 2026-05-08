import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Pencil, Square, CircleIcon, MousePointer2, StickyNote,
  Trash2, Download, Code, Undo2, Redo2, RotateCcw, Ruler, Grid3X3,
  Sparkles, Box, Zap, Layers, Highlighter, Gamepad2, LayoutTemplate,
  Presentation, Phone, Clock, BarChart3, Users, Link, Palette,
  Globe, Network, GitCommit, Command, ArrowRight, Hash, Star, Video as VideoIcon, QrCode, Music
} from 'lucide-react';

const COMMANDS = [
  // Tools
  { id: 'tool-select', label: 'Select Tool', icon: MousePointer2, category: 'Tools', action: 'setTool', value: 'select', shortcut: 'V' },
  { id: 'tool-pen', label: 'Pen Tool', icon: Pencil, category: 'Tools', action: 'setTool', value: 'pen', shortcut: 'P' },
  { id: 'tool-rect', label: 'Rectangle Tool', icon: Square, category: 'Tools', action: 'setTool', value: 'rect', shortcut: 'R' },
  { id: 'tool-circle', label: 'Ellipse Tool', icon: CircleIcon, category: 'Tools', action: 'setTool', value: 'circle', shortcut: 'O' },
  { id: 'tool-note', label: 'Sticky Note', icon: StickyNote, category: 'Tools', action: 'setTool', value: 'note', shortcut: 'N' },
  { id: 'tool-connector', label: 'Connector Tool', icon: GitCommit, category: 'Tools', action: 'setTool', value: 'connector' },
  { id: 'tool-dimension', label: 'Dimension Line', icon: Ruler, category: 'Tools', action: 'setTool', value: 'dimension' },
  { id: 'tool-frame', label: 'Frame Tool', icon: Square, category: 'Tools', action: 'setTool', value: 'frame' },
  { id: 'tool-chart', label: 'Chart Widget', icon: BarChart3, category: 'Tools', action: 'setTool', value: 'chart' },
  { id: 'tool-iframe', label: 'Embed (iframe)', icon: Globe, category: 'Tools', action: 'setTool', value: 'iframe' },
  { id: 'tool-video', label: 'Video Player', icon: VideoIcon, category: 'Tools', action: 'setTool', value: 'video' },
  { id: 'tool-qr', label: 'QR Code Generator', icon: QrCode, category: 'Tools', action: 'addQRCode' },
  { id: 'tool-reaction-wheel', label: 'Reaction Wheel', icon: Sparkles, category: 'Tools', action: 'toggleReactionWheel', shortcut: 'E' },
  { id: 'tool-portal', label: 'Portal', icon: Network, category: 'Tools', action: 'setTool', value: 'portal' },
  { id: 'tool-code-widget', label: 'Code Widget', icon: Code, category: 'Tools', action: 'addCodeWidget' },

  // Actions
  { id: 'action-undo', label: 'Undo', icon: Undo2, category: 'Actions', action: 'undo', shortcut: 'Ctrl+Z' },
  { id: 'action-redo', label: 'Redo', icon: Redo2, category: 'Actions', action: 'redo', shortcut: 'Ctrl+Y' },
  { id: 'action-clear', label: 'Clear Canvas', icon: Trash2, category: 'Actions', action: 'clear' },
  { id: 'action-export', label: 'Export as PNG', icon: Download, category: 'Actions', action: 'export' },
  { id: 'action-copy-link', label: 'Copy Room Link', icon: Link, category: 'Actions', action: 'copyLink' },
  { id: 'action-layout-grid', label: 'Arrange as Grid', icon: LayoutGrid, category: 'Actions', action: 'layout', value: 'grid' },
  { id: 'action-layout-circle', label: 'Arrange as Circle', icon: CircleIcon, category: 'Actions', action: 'layout', value: 'circle' },
  { id: 'action-layout-mindmap', label: 'Radial Mind Map', icon: Workflow, category: 'Actions', action: 'layout', value: 'mind-map' },
  { id: 'action-layout-spiral', label: 'Spiral Layout', icon: RotateCcw, category: 'Actions', action: 'layout', value: 'spiral' },

  // Panels
  { id: 'panel-ai', label: 'AI Design Assistant', icon: Sparkles, category: 'Panels', action: 'togglePanel', value: 'ai' },
  { id: 'panel-templates', label: 'Templates Gallery', icon: LayoutTemplate, category: 'Panels', action: 'togglePanel', value: 'templates' },
  { id: 'panel-scenes', label: 'Presentation Scenes', icon: Presentation, category: 'Panels', action: 'togglePanel', value: 'scenes' },
  { id: 'panel-layers', label: 'Layers Panel', icon: Layers, category: 'Panels', action: 'togglePanel', value: 'layers' },
  { id: 'panel-timer', label: 'Collaborative Timer', icon: Clock, category: 'Panels', action: 'togglePanel', value: 'timer' },
  { id: 'panel-analytics', label: 'Board Analytics', icon: BarChart3, category: 'Panels', action: 'togglePanel', value: 'analytics' },
  { id: 'panel-share', label: 'Share Settings', icon: Users, category: 'Panels', action: 'togglePanel', value: 'share' },
  { id: 'panel-call', label: 'Voice / Video Call', icon: Phone, category: 'Panels', action: 'togglePanel', value: 'call' },
  { id: 'panel-code', label: 'Code Export', icon: Code, category: 'Panels', action: 'togglePanel', value: 'code' },
  { id: 'panel-brandkit', label: 'Brand Kit', icon: Palette, category: 'Panels', action: 'togglePanel', value: 'brandkit' },
  { id: 'panel-soundboard', label: 'Soundboard (Audio)', icon: Music, category: 'Panels', action: 'togglePanel', value: 'soundboard' },

  // Toggles
  { id: 'toggle-3d', label: 'Toggle 3D View', icon: Box, category: 'View', action: 'toggle', value: '3d' },
  { id: 'toggle-physics', label: 'Toggle Physics Engine', icon: Zap, category: 'View', action: 'toggle', value: 'physics' },
  { id: 'toggle-heatmap', label: 'Toggle Activity Heatmap', icon: Sparkles, category: 'View', action: 'toggle', value: 'heatmap' },
  { id: 'toggle-sketch', label: 'Toggle Sketch Mode', icon: Highlighter, category: 'View', action: 'toggle', value: 'sketch' },
  { id: 'toggle-sandbox', label: 'Toggle Sandbox Mode', icon: Gamepad2, category: 'View', action: 'toggle', value: 'sandbox' },
  { id: 'toggle-grid', label: 'Toggle Grid Snapping', icon: Grid3X3, category: 'View', action: 'toggle', value: 'grid' },
];

const CATEGORY_COLORS = {
  Tools: '#6366f1',
  Actions: '#f59e0b',
  Panels: '#10b981',
  View: '#ec4899',
};

export default function CommandPalette({ isOpen, onClose, onCommand }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return COMMANDS;
    const q = query.toLowerCase();
    return COMMANDS.filter(
      cmd => cmd.label.toLowerCase().includes(q) || cmd.category.toLowerCase().includes(q)
    );
  }, [query]);

  // Group by category
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(cmd => {
      if (!map[cmd.category]) map[cmd.category] = [];
      map[cmd.category].push(cmd);
    });
    return map;
  }, [filtered]);

  const flatList = useMemo(() => filtered, [filtered]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIndex}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const executeCommand = useCallback((cmd) => {
    onCommand(cmd);
    onClose();
  }, [onCommand, onClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatList[selectedIndex]) executeCommand(flatList[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [flatList, selectedIndex, executeCommand, onClose]);

  if (!isOpen) return null;

  let globalIdx = -1;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 10000,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
            }}
          />
          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              top: '15%',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10001,
              width: '560px',
              maxWidth: '90vw',
              maxHeight: '480px',
              background: 'rgba(15, 15, 25, 0.96)',
              backdropFilter: 'blur(24px) saturate(1.8)',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {/* Search Input */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
              <Search size={18} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search commands, tools, panels..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: '#fff', fontSize: '15px', fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                }}
              />
              <div style={{
                padding: '3px 8px', borderRadius: '6px',
                background: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.35)',
                fontSize: '11px', fontWeight: 600,
                whiteSpace: 'nowrap',
              }}>
                ESC
              </div>
            </div>

            {/* Results */}
            <div ref={listRef} style={{ overflowY: 'auto', padding: '8px', flex: 1 }}>
              {flatList.length === 0 && (
                <div style={{
                  padding: '32px 16px', textAlign: 'center',
                  color: 'rgba(255,255,255,0.3)', fontSize: '14px',
                }}>
                  No commands found for "{query}"
                </div>
              )}
              {Object.entries(grouped).map(([category, cmds]) => (
                <div key={category}>
                  <div style={{
                    padding: '8px 12px 4px',
                    fontSize: '10px', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    color: CATEGORY_COLORS[category] || 'rgba(255,255,255,0.3)',
                  }}>
                    {category}
                  </div>
                  {cmds.map(cmd => {
                    globalIdx++;
                    const idx = globalIdx;
                    const isSelected = idx === selectedIndex;
                    const Icon = cmd.icon;
                    return (
                      <div
                        key={cmd.id}
                        data-idx={idx}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '10px 12px', borderRadius: '10px',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                          transition: 'background 0.1s',
                        }}
                      >
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isSelected
                            ? `${CATEGORY_COLORS[category] || '#6366f1'}22`
                            : 'rgba(255,255,255,0.05)',
                          color: isSelected
                            ? (CATEGORY_COLORS[category] || '#6366f1')
                            : 'rgba(255,255,255,0.5)',
                          transition: 'all 0.15s',
                        }}>
                          <Icon size={16} />
                        </div>
                        <span style={{
                          flex: 1, fontSize: '13px', fontWeight: 500,
                          color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)',
                        }}>
                          {cmd.label}
                        </span>
                        {cmd.shortcut && (
                          <span style={{
                            fontSize: '11px', fontWeight: 600,
                            color: 'rgba(255,255,255,0.25)',
                            padding: '2px 6px', borderRadius: '4px',
                            background: 'rgba(255,255,255,0.06)',
                          }}>
                            {cmd.shortcut}
                          </span>
                        )}
                        {isSelected && (
                          <ArrowRight size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              padding: '10px 16px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: '16px',
              fontSize: '11px', color: 'rgba(255,255,255,0.25)',
            }}>
              <span>↑↓ Navigate</span>
              <span>↵ Run</span>
              <span>ESC Close</span>
              <span style={{ marginLeft: 'auto' }}>
                <Command size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> K to toggle
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
