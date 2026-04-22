// CADPropertiesPanel.jsx — Right-side properties panel for selected entities
import React, { useState, useEffect } from 'react';

const UNIT_OPTIONS = ['mm', 'inch', 'cm'];
const LINE_TYPES = ['continuous', 'dashed', 'center', 'phantom'];

export default function CADPropertiesPanel({
  entities,
  selectedIds,
  layers,
  activeLayer,
  units,
  precision,
  gridSize,
  snapSettings,
  onUpdateEntity,
  onSetUnits,
  onSetPrecision,
  onSetGridSize,
  onSetSnapSettings,
}) {
  const selected = [];
  if (selectedIds && entities) {
    for (const id of selectedIds) {
      const ent = entities instanceof Map ? entities.get(id) : null;
      if (ent) selected.push(ent);
    }
  }

  const [localProps, setLocalProps] = useState({});

  useEffect(() => {
    if (selected.length === 1) {
      setLocalProps({ ...selected[0] });
    } else {
      setLocalProps({});
    }
  }, [selectedIds, entities]);

  const handleChange = (key, value) => {
    setLocalProps(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    if (selected.length === 1 && onUpdateEntity) {
      onUpdateEntity(selected[0].id, localProps);
    }
  };

  // ── No selection: Document properties ──
  if (selected.length === 0) {
    return (
      <div style={styles.panel}>
        <div style={styles.header}>Document Properties</div>

        <div style={styles.section}>
          <label style={styles.label}>Units</label>
          <select
            style={styles.select}
            value={units}
            onChange={(e) => onSetUnits?.(e.target.value)}
          >
            {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Precision</label>
          <input
            type="number"
            style={styles.input}
            value={precision}
            min={0}
            max={8}
            onChange={(e) => onSetPrecision?.(parseInt(e.target.value))}
          />
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Grid Size</label>
          <input
            type="number"
            style={styles.input}
            value={gridSize}
            min={1}
            max={1000}
            onChange={(e) => onSetGridSize?.(parseFloat(e.target.value))}
          />
        </div>

        <div style={styles.divider} />
        <div style={styles.subHeader}>Snap Settings (OSnap)</div>
        {snapSettings && Object.entries(snapSettings).map(([key, val]) => (
          <div key={key} style={styles.snapRow}>
            <label style={styles.snapLabel}>
              <input
                type="checkbox"
                checked={val}
                onChange={() => onSetSnapSettings?.({ ...snapSettings, [key]: !val })}
                style={styles.checkbox}
              />
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </label>
          </div>
        ))}
      </div>
    );
  }

  // ── Multiple selection: Shared properties ──
  if (selected.length > 1) {
    return (
      <div style={styles.panel}>
        <div style={styles.header}>{selected.length} Entities Selected</div>

        <div style={styles.section}>
          <label style={styles.label}>Layer</label>
          <select
            style={styles.select}
            value=""
            onChange={(e) => {
              for (const ent of selected) {
                onUpdateEntity?.(ent.id, { layer: e.target.value });
              }
            }}
          >
            <option value="" disabled>Mixed</option>
            {layers?.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
          </select>
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Color</label>
          <input
            type="color"
            style={styles.colorPicker}
            onChange={(e) => {
              for (const ent of selected) {
                onUpdateEntity?.(ent.id, { color: e.target.value });
              }
            }}
          />
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Line Width</label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.5"
            style={styles.slider}
            onChange={(e) => {
              for (const ent of selected) {
                onUpdateEntity?.(ent.id, { lineWidth: parseFloat(e.target.value) });
              }
            }}
          />
        </div>
      </div>
    );
  }

  // ── Single selection: Full editable properties ──
  const ent = selected[0];

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.typeTag}>{ent.type.toUpperCase()}</span>
        Properties
      </div>

      <div style={styles.section}>
        <label style={styles.label}>ID</label>
        <div style={styles.readOnly}>{ent.id}</div>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Layer</label>
        <select
          style={styles.select}
          value={localProps.layer || ent.layer}
          onChange={(e) => handleChange('layer', e.target.value)}
        >
          {layers?.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
        </select>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Color</label>
        <input
          type="color"
          style={styles.colorPicker}
          value={localProps.color || ent.color || '#e6edf3'}
          onChange={(e) => handleChange('color', e.target.value)}
        />
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Line Width</label>
        <input
          type="range"
          min="0.5"
          max="5"
          step="0.5"
          style={styles.slider}
          value={localProps.lineWidth ?? ent.lineWidth ?? 1}
          onChange={(e) => handleChange('lineWidth', parseFloat(e.target.value))}
        />
        <span style={styles.valueLabel}>{localProps.lineWidth ?? ent.lineWidth ?? 1}</span>
      </div>

      <div style={styles.divider} />

      {/* Type-specific fields */}
      {(ent.type === 'line') && (
        <>
          <NumField label="X1" value={localProps.x1} onChange={v => handleChange('x1', v)} />
          <NumField label="Y1" value={localProps.y1} onChange={v => handleChange('y1', v)} />
          <NumField label="X2" value={localProps.x2} onChange={v => handleChange('x2', v)} />
          <NumField label="Y2" value={localProps.y2} onChange={v => handleChange('y2', v)} />
        </>
      )}

      {(ent.type === 'circle') && (
        <>
          <NumField label="Center X" value={localProps.cx} onChange={v => handleChange('cx', v)} />
          <NumField label="Center Y" value={localProps.cy} onChange={v => handleChange('cy', v)} />
          <NumField label="Radius" value={localProps.radius} onChange={v => handleChange('radius', v)} />
        </>
      )}

      {(ent.type === 'arc') && (
        <>
          <NumField label="Center X" value={localProps.cx} onChange={v => handleChange('cx', v)} />
          <NumField label="Center Y" value={localProps.cy} onChange={v => handleChange('cy', v)} />
          <NumField label="Radius" value={localProps.radius} onChange={v => handleChange('radius', v)} />
          <NumField label="Start Angle" value={localProps.startAngle} onChange={v => handleChange('startAngle', v)} />
          <NumField label="End Angle" value={localProps.endAngle} onChange={v => handleChange('endAngle', v)} />
        </>
      )}

      {(ent.type === 'rectangle') && (
        <>
          <NumField label="X" value={localProps.x} onChange={v => handleChange('x', v)} />
          <NumField label="Y" value={localProps.y} onChange={v => handleChange('y', v)} />
          <NumField label="Width" value={localProps.width} onChange={v => handleChange('width', v)} />
          <NumField label="Height" value={localProps.height} onChange={v => handleChange('height', v)} />
        </>
      )}

      {(ent.type === 'text') && (
        <>
          <NumField label="X" value={localProps.x} onChange={v => handleChange('x', v)} />
          <NumField label="Y" value={localProps.y} onChange={v => handleChange('y', v)} />
          <div style={styles.section}>
            <label style={styles.label}>Text</label>
            <input
              type="text"
              style={styles.input}
              value={localProps.text || ''}
              onChange={(e) => handleChange('text', e.target.value)}
            />
          </div>
          <NumField label="Font Size" value={localProps.fontSize} onChange={v => handleChange('fontSize', v)} />
        </>
      )}

      <div style={{ marginTop: 12 }}>
        <button style={styles.applyBtn} onClick={handleApply}>
          Apply Changes
        </button>
      </div>
    </div>
  );
}

function NumField({ label, value, onChange }) {
  return (
    <div style={styles.section}>
      <label style={styles.label}>{label}</label>
      <input
        type="number"
        style={styles.input}
        value={value ?? ''}
        step="any"
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

const styles = {
  panel: {
    position: 'absolute',
    top: 48,
    right: 0,
    width: 240,
    bottom: 32,
    backgroundColor: '#161b22',
    borderLeft: '1px solid #30363d',
    color: '#e6edf3',
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    fontSize: 12,
    overflowY: 'auto',
    padding: '0 0 12px 0',
    zIndex: 100,
    scrollbarWidth: 'thin',
    scrollbarColor: '#30363d #161b22',
  },
  header: {
    padding: '12px 14px 8px',
    fontSize: 13,
    fontWeight: 600,
    color: '#e6edf3',
    borderBottom: '1px solid #21262d',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  typeTag: {
    backgroundColor: '#58a6ff22',
    color: '#58a6ff',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    fontFamily: '"JetBrains Mono", monospace',
  },
  section: {
    padding: '6px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    color: '#8b949e',
    fontSize: 11,
    minWidth: 60,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    backgroundColor: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: 4,
    color: '#e6edf3',
    padding: '4px 8px',
    fontSize: 12,
    fontFamily: '"JetBrains Mono", monospace',
    outline: 'none',
    width: '100%',
    maxWidth: 120,
  },
  select: {
    flex: 1,
    backgroundColor: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: 4,
    color: '#e6edf3',
    padding: '4px 8px',
    fontSize: 12,
    outline: 'none',
    cursor: 'pointer',
    maxWidth: 120,
  },
  colorPicker: {
    width: 32,
    height: 24,
    border: '1px solid #30363d',
    borderRadius: 4,
    cursor: 'pointer',
    backgroundColor: 'transparent',
    padding: 0,
  },
  slider: {
    flex: 1,
    accentColor: '#58a6ff',
    cursor: 'pointer',
  },
  valueLabel: {
    color: '#79c0ff',
    fontSize: 11,
    fontFamily: '"JetBrains Mono", monospace',
    minWidth: 20,
    textAlign: 'right',
  },
  readOnly: {
    color: '#484f58',
    fontSize: 10,
    fontFamily: '"JetBrains Mono", monospace',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 130,
  },
  divider: {
    height: 1,
    backgroundColor: '#21262d',
    margin: '8px 14px',
  },
  subHeader: {
    padding: '4px 14px 6px',
    fontSize: 11,
    fontWeight: 600,
    color: '#8b949e',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  snapRow: {
    padding: '2px 14px',
  },
  snapLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    color: '#e6edf3',
    fontSize: 11,
  },
  checkbox: {
    accentColor: '#58a6ff',
    cursor: 'pointer',
  },
  applyBtn: {
    display: 'block',
    width: 'calc(100% - 28px)',
    margin: '0 14px',
    padding: '7px 0',
    backgroundColor: '#238636',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
};
