// CADLayerManager.jsx — Toggleable bottom-right layer manager panel
import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Unlock, Plus, Trash2 } from 'lucide-react';

const LINE_TYPE_OPTIONS = ['continuous', 'dashed', 'center', 'phantom'];

export default function CADLayerManager({
  layers,
  activeLayer,
  onSetActiveLayer,
  onAddLayer,
  onDeleteLayer,
  onUpdateLayer,
  visible,
}) {
  const [newLayerName, setNewLayerName] = useState('');

  if (!visible) return null;

  const handleAddLayer = () => {
    const name = newLayerName.trim();
    if (!name || layers.some(l => l.name === name)) return;
    onAddLayer?.({
      name,
      color: '#e6edf3',
      visible: true,
      locked: false,
      lineType: 'continuous',
    });
    setNewLayerName('');
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>Layers</span>
        <span style={styles.layerCount}>{layers.length}</span>
      </div>

      <div style={styles.layerList}>
        {layers.map((layer) => {
          const isActive = activeLayer === layer.name;
          return (
            <div
              key={layer.name}
              style={{
                ...styles.layerRow,
                ...(isActive ? styles.layerRowActive : {}),
              }}
            >
              {/* Color swatch */}
              <input
                type="color"
                value={layer.color}
                style={styles.colorSwatch}
                onChange={(e) => onUpdateLayer?.(layer.name, { color: e.target.value })}
                title="Layer color"
              />

              {/* Name — click to activate */}
              <div
                style={{
                  ...styles.layerName,
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? '#58a6ff' : '#e6edf3',
                }}
                onClick={() => onSetActiveLayer?.(layer.name)}
                title="Click to make active"
              >
                {layer.name}
                {isActive && <span style={styles.activeBadge}>●</span>}
              </div>

              {/* Line type dropdown */}
              <select
                style={styles.lineTypeSelect}
                value={layer.lineType}
                onChange={(e) => onUpdateLayer?.(layer.name, { lineType: e.target.value })}
                title="Line type"
              >
                {LINE_TYPE_OPTIONS.map(lt => (
                  <option key={lt} value={lt}>{lt}</option>
                ))}
              </select>

              {/* Visibility toggle */}
              <button
                style={styles.iconBtn}
                onClick={() => onUpdateLayer?.(layer.name, { visible: !layer.visible })}
                title={layer.visible ? 'Hide layer' : 'Show layer'}
              >
                {layer.visible
                  ? <Eye size={14} color="#7ee787" />
                  : <EyeOff size={14} color="#484f58" />
                }
              </button>

              {/* Lock toggle */}
              <button
                style={styles.iconBtn}
                onClick={() => onUpdateLayer?.(layer.name, { locked: !layer.locked })}
                title={layer.locked ? 'Unlock layer' : 'Lock layer'}
              >
                {layer.locked
                  ? <Lock size={14} color="#f0883e" />
                  : <Unlock size={14} color="#484f58" />
                }
              </button>

              {/* Delete */}
              {layer.name !== '0' && (
                <button
                  style={styles.iconBtn}
                  onClick={() => onDeleteLayer?.(layer.name)}
                  title="Delete layer"
                >
                  <Trash2 size={13} color="#f8514999" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add layer row */}
      <div style={styles.addRow}>
        <input
          type="text"
          style={styles.addInput}
          placeholder="New layer name..."
          value={newLayerName}
          onChange={(e) => setNewLayerName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddLayer()}
        />
        <button style={styles.addBtn} onClick={handleAddLayer} title="Add layer">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

const styles = {
  panel: {
    position: 'absolute',
    bottom: 40,
    right: 8,
    width: 380,
    maxHeight: 320,
    backgroundColor: '#161b22',
    border: '1px solid #30363d',
    borderRadius: 10,
    zIndex: 110,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    fontFamily: '"Inter", sans-serif',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderBottom: '1px solid #21262d',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#e6edf3',
  },
  layerCount: {
    backgroundColor: '#30363d',
    color: '#8b949e',
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 10,
    fontWeight: 600,
  },
  layerList: {
    flex: 1,
    overflowY: 'auto',
    scrollbarWidth: 'thin',
    scrollbarColor: '#30363d #161b22',
  },
  layerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 10px',
    borderBottom: '1px solid #21262d11',
    transition: 'background 0.1s',
  },
  layerRowActive: {
    backgroundColor: '#58a6ff0d',
  },
  colorSwatch: {
    width: 18,
    height: 18,
    border: '1px solid #30363d',
    borderRadius: 3,
    padding: 0,
    cursor: 'pointer',
    backgroundColor: 'transparent',
    flexShrink: 0,
  },
  layerName: {
    flex: 1,
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  },
  activeBadge: {
    color: '#58a6ff',
    fontSize: 8,
  },
  lineTypeSelect: {
    backgroundColor: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: 3,
    color: '#8b949e',
    fontSize: 10,
    padding: '2px 4px',
    outline: 'none',
    cursor: 'pointer',
    width: 80,
    flexShrink: 0,
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 3,
    display: 'flex',
    alignItems: 'center',
    borderRadius: 4,
    transition: 'background 0.1s',
    flexShrink: 0,
  },
  addRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 10px',
    borderTop: '1px solid #21262d',
  },
  addInput: {
    flex: 1,
    backgroundColor: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: 5,
    color: '#e6edf3',
    padding: '5px 8px',
    fontSize: 12,
    outline: 'none',
    fontFamily: '"Inter", sans-serif',
  },
  addBtn: {
    backgroundColor: '#238636',
    border: 'none',
    borderRadius: 5,
    color: '#fff',
    width: 30,
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
};
