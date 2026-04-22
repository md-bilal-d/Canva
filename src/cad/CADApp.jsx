// CADApp.jsx — Top-level CAD application assembly
// Wires all components together with keyboard shortcuts, menu bar, and layout
import React, { useState, useEffect, useCallback, useRef } from 'react';
import CADCanvas from './CADCanvas.jsx';
import CADToolbar from './CADToolbar.jsx';
import CADPropertiesPanel from './CADPropertiesPanel.jsx';
import CADLayerManager from './CADLayerManager.jsx';
import CADCommandBar from './CADCommandBar.jsx';
import useCadStore from './useCadStore.js';
import { createTool } from './cadTools.js';
import { Text } from './cadGeometry.js';
import { parseDXF, generateDXF, exportSVG } from './cadDXF.js';

// ─── MENU STRUCTURE ─────────────────────────────────────────────
const MENUS = [
  {
    label: 'File',
    items: [
      { label: 'New', action: 'new', shortcut: 'Ctrl+N' },
      { label: 'Open DXF...', action: 'open' },
      { label: 'Save', action: 'save', shortcut: 'Ctrl+S' },
      { type: 'divider' },
      { label: 'Export DXF', action: 'export_dxf' },
      { label: 'Export SVG', action: 'export_svg' },
    ],
  },
  {
    label: 'Edit',
    items: [
      { label: 'Undo', action: 'undo', shortcut: 'Ctrl+Z' },
      { label: 'Redo', action: 'redo', shortcut: 'Ctrl+Y' },
      { type: 'divider' },
      { label: 'Select All', action: 'select_all', shortcut: 'Ctrl+A' },
      { label: 'Delete', action: 'delete', shortcut: 'Del' },
    ],
  },
  {
    label: 'View',
    items: [
      { label: 'Zoom Fit', action: 'zoom_fit' },
      { label: 'Zoom In', action: 'zoom_in' },
      { label: 'Zoom Out', action: 'zoom_out' },
      { type: 'divider' },
      { label: 'Toggle Grid', action: 'toggle_grid' },
      { label: 'Toggle Snap', action: 'toggle_snap' },
      { label: 'Toggle Layers', action: 'toggle_layers', shortcut: 'L' },
    ],
  },
  {
    label: 'Draw',
    items: [
      { label: 'Line', action: 'tool:line', shortcut: 'L' },
      { label: 'Polyline', action: 'tool:polyline' },
      { label: 'Rectangle', action: 'tool:rectangle' },
      { label: 'Circle', action: 'tool:circle' },
      { label: 'Arc', action: 'tool:arc' },
      { label: 'Polygon', action: 'tool:polygon' },
      { label: 'Text', action: 'tool:text' },
    ],
  },
  {
    label: 'Modify',
    items: [
      { label: 'Move', action: 'tool:move' },
      { label: 'Rotate', action: 'tool:rotate' },
      { label: 'Scale', action: 'tool:scale' },
      { label: 'Mirror', action: 'tool:mirror' },
      { type: 'divider' },
      { label: 'Trim', action: 'tool:trim' },
      { label: 'Extend', action: 'tool:extend' },
      { label: 'Offset', action: 'tool:offset' },
      { label: 'Fillet', action: 'tool:fillet' },
      { label: 'Chamfer', action: 'tool:chamfer' },
      { label: 'Array', action: 'tool:array' },
      { label: 'Explode', action: 'tool:explode' },
    ],
  },
];

const ZOOM_PRESETS = {
  '1': 0.1, '2': 0.25, '3': 0.5, '4': 0.75,
  '5': 1, '6': 1.5, '7': 2, '8': 5, '9': 10,
};

export default function CADApp() {
  const store = useCadStore();
  const [showLayerManager, setShowLayerManager] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const toolRef = useRef(createTool('select'));
  const fileInputRef = useRef(null);

  // Keep tool instance in sync with activeTool
  useEffect(() => {
    toolRef.current = createTool(store.activeTool);
  }, [store.activeTool]);

  // ─── MENU ACTIONS ──────────────────────────────────────────
  const handleMenuAction = useCallback((action) => {
    setOpenMenu(null);

    if (action.startsWith('tool:')) {
      const toolName = action.slice(5);
      store.setActiveTool(toolName);
      return;
    }

    switch (action) {
      case 'new':
        store.newDocument();
        break;
      case 'open':
        fileInputRef.current?.click();
        break;
      case 'save':
      case 'export_dxf': {
        const dxf = generateDXF(store.entities, store.layers);
        downloadFile(dxf, 'drawing.dxf', 'application/dxf');
        break;
      }
      case 'export_svg': {
        const svg = exportSVG(store.entities);
        downloadFile(svg, 'drawing.svg', 'image/svg+xml');
        break;
      }
      case 'undo':
        store.undo();
        break;
      case 'redo':
        store.redo();
        break;
      case 'select_all':
        store.selectAll();
        break;
      case 'delete':
        store.deleteSelected();
        break;
      case 'zoom_fit':
        store.setViewState({ panX: window.innerWidth / 2, panY: window.innerHeight / 2, zoom: 1 });
        break;
      case 'zoom_in':
        store.setViewState({ zoom: Math.min(100, store.viewState.zoom * 1.5) });
        break;
      case 'zoom_out':
        store.setViewState({ zoom: Math.max(0.01, store.viewState.zoom / 1.5) });
        break;
      case 'toggle_layers':
        setShowLayerManager(prev => !prev);
        break;
      case 'toggle_grid':
        store.setSnapSettings({ ...store.snapSettings, grid: !store.snapSettings.grid });
        break;
      case 'toggle_snap':
        store.setSnapSettings({
          ...store.snapSettings,
          endpoint: !store.snapSettings.endpoint,
          midpoint: !store.snapSettings.midpoint,
          center: !store.snapSettings.center,
        });
        break;
    }
  }, [store]);

  // ─── FILE IMPORT ───────────────────────────────────────────
  const handleFileImport = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target.result;
      try {
        const result = parseDXF(content);
        for (const ent of result.entities) {
          store.addEntity(ent);
        }
        for (const layer of result.layers) {
          if (!store.layers.find(l => l.name === layer.name)) {
            store.addLayer(layer);
          }
        }
      } catch (err) {
        console.error('DXF Parse Error:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [store]);

  // ─── CANVAS CALLBACKS ─────────────────────────────────────
  const handleCanvasClick = useCallback((point) => {
    const tool = toolRef.current;
    if (!tool) return;

    // Handle select tool specially
    if (tool.name === 'select') {
      tool.onMouseDown(point);
      return;
    }

    tool.onMouseDown(point);

    if (tool.isFinished()) {
      const result = tool.getResult();
      if (result) {
        if (result.type === 'text-input-request') {
          // Will be handled by command bar
        } else if (result.type === 'move' || result.type === 'rotate' || result.type === 'scale' || result.type === 'mirror') {
          applyTransform(result, store);
        } else if (result.id && result.type) {
          // It's an entity
          result.layer = store.activeLayer;
          const layerObj = store.layers.find(l => l.name === store.activeLayer);
          if (layerObj) result.color = layerObj.color;
          store.addEntity(result);
        }
      }
      // For chaining tools like Line, create a fresh instance check
      if (!tool.p1 && !tool.center) {
        // Tool fully consumed, reset for next use
      }
      tool._finished = false;
      tool._result = null;
    }
  }, [store]);

  const handleCanvasMove = useCallback((point) => {
    const tool = toolRef.current;
    if (tool) tool.onMouseMove(point);
  }, []);

  const handleCanvasUp = useCallback((point) => {
    const tool = toolRef.current;
    if (!tool) return;

    if (tool.name === 'select') {
      tool.onMouseUp(point, store.entities, point.shiftKey);
      if (tool.isFinished()) {
        const result = tool.getResult();
        if (result.type === 'click-select') {
          if (result.id) {
            if (result.additive) store.toggleSelect(result.id);
            else store.selectEntities([result.id]);
          } else if (!result.additive) {
            store.clearSelection();
          }
        } else if (result.type === 'box-select') {
          if (result.additive) {
            const prev = [...store.selectedIds];
            store.selectEntities([...new Set([...prev, ...result.ids])]);
          } else {
            store.selectEntities(result.ids);
          }
        }
        tool._finished = false;
        tool._result = null;
      }
    }
  }, [store]);

  // ─── KEYBOARD SHORTCUTS ────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      // Don't intercept if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      // Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        toolRef.current?.reset();
        store.clearSelection();
        store.setActiveTool('select');
        setOpenMenu(null);
        return;
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (store.selectedIds.size > 0) {
          e.preventDefault();
          store.deleteSelected();
        }
        return;
      }

      // Ctrl shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) store.redo();
            else store.undo();
            return;
          case 'y':
            e.preventDefault();
            store.redo();
            return;
          case 'a':
            e.preventDefault();
            store.selectAll();
            return;
          case 's':
            e.preventDefault();
            handleMenuAction('export_dxf');
            return;
        }
        return;
      }

      // L key — toggle layers
      if (e.key.toLowerCase() === 'l' && !e.ctrlKey) {
        setShowLayerManager(prev => !prev);
        return;
      }

      // Number keys — zoom presets
      if (ZOOM_PRESETS[e.key]) {
        e.preventDefault();
        const canvas = document.querySelector('canvas');
        if (canvas) {
          store.setViewState({
            zoom: ZOOM_PRESETS[e.key],
            panX: canvas.width / 2,
            panY: canvas.height / 2,
          });
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [store, handleMenuAction]);

  // ─── COMMAND BAR HANDLERS ──────────────────────────────────
  const handleCommand = useCallback((cmd) => {
    if (cmd === 'undo') store.undo();
    else if (cmd === 'redo') store.redo();
    else if (cmd === 'delete') store.deleteSelected();
  }, [store]);

  const handleCommandToolChange = useCallback((toolName) => {
    store.setActiveTool(toolName);
  }, [store]);

  const handleValueSubmit = useCallback((key, value) => {
    const tool = toolRef.current;
    if (!tool) return;

    // Special: text tool input
    if (tool.name === 'text' && tool.position && value) {
      const layerObj = store.layers.find(l => l.name === store.activeLayer);
      const ent = new Text(tool.position.x, tool.position.y, value, 14, 0, {
        layer: store.activeLayer,
        color: layerObj?.color || '#e6edf3',
      });
      store.addEntity(ent);
      tool.reset();
      return;
    }

    tool.onKeyDown(key, value);
    if (tool.isFinished()) {
      const result = tool.getResult();
      if (result && result.id && result.type) {
        result.layer = store.activeLayer;
        store.addEntity(result);
      } else if (result && (result.type === 'move' || result.type === 'rotate' || result.type === 'scale')) {
        applyTransform(result, store);
      }
      tool._finished = false;
      tool._result = null;
    }
  }, [store]);

  const handleCancel = useCallback(() => {
    toolRef.current?.reset();
    store.setActiveTool('select');
  }, [store]);

  // Close menu on outside click
  useEffect(() => {
    if (openMenu === null) return;
    const handler = () => setOpenMenu(null);
    setTimeout(() => window.addEventListener('click', handler), 0);
    return () => window.removeEventListener('click', handler);
  }, [openMenu]);

  return (
    <div style={styles.root}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".dxf"
        style={{ display: 'none' }}
        onChange={handleFileImport}
      />

      {/* ── TOP MENU BAR ── */}
      <div style={styles.menuBar}>
        <div style={styles.appTitle}>
          <span style={styles.appIcon}>◇</span>
          CAD Studio
        </div>
        {MENUS.map((menu, mi) => (
          <div key={menu.label} style={styles.menuItemWrapper}>
            <div
              style={{
                ...styles.menuItem,
                ...(openMenu === mi ? styles.menuItemOpen : {}),
              }}
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenu(openMenu === mi ? null : mi);
              }}
              onMouseEnter={() => openMenu !== null && setOpenMenu(mi)}
            >
              {menu.label}
            </div>
            {openMenu === mi && (
              <div style={styles.menuDropdown} onClick={(e) => e.stopPropagation()}>
                {menu.items.map((item, ii) => {
                  if (item.type === 'divider') {
                    return <div key={ii} style={styles.menuDivider} />;
                  }
                  return (
                    <div
                      key={ii}
                      style={styles.menuDropdownItem}
                      onClick={() => handleMenuAction(item.action)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e2730'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span style={styles.menuShortcut}>{item.shortcut}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* Right side — active layer indicator */}
        <div style={styles.menuRight}>
          <span style={styles.layerIndicator}>
            <span style={{
              ...styles.layerDot,
              backgroundColor: store.layers.find(l => l.name === store.activeLayer)?.color || '#e6edf3',
            }} />
            Layer: {store.activeLayer}
          </span>
          <span style={styles.entityCount}>
            {store.entities.size} entities
          </span>
        </div>
      </div>

      {/* ── CANVAS ── */}
      <CADCanvas
        entities={store.entities}
        selectedIds={store.selectedIds}
        viewState={store.viewState}
        setViewState={store.setViewState}
        snapSettings={store.snapSettings}
        gridSize={store.gridSize}
        activeTool={store.activeTool}
        toolInstance={toolRef.current}
        onCanvasClick={handleCanvasClick}
        onCanvasMove={handleCanvasMove}
        onCanvasUp={handleCanvasUp}
      />

      {/* ── LEFT TOOLBAR ── */}
      <CADToolbar
        activeTool={store.activeTool}
        onToolChange={(t) => store.setActiveTool(t)}
      />

      {/* ── RIGHT PROPERTIES PANEL ── */}
      <CADPropertiesPanel
        entities={store.entities}
        selectedIds={store.selectedIds}
        layers={store.layers}
        activeLayer={store.activeLayer}
        units={store.units}
        precision={store.precision}
        gridSize={store.gridSize}
        snapSettings={store.snapSettings}
        onUpdateEntity={store.updateEntity}
        onSetUnits={store.setUnits}
        onSetPrecision={store.setPrecision}
        onSetGridSize={store.setGridSize}
        onSetSnapSettings={store.setSnapSettings}
      />

      {/* ── LAYER MANAGER ── */}
      <CADLayerManager
        layers={store.layers}
        activeLayer={store.activeLayer}
        onSetActiveLayer={store.setActiveLayer}
        onAddLayer={store.addLayer}
        onDeleteLayer={store.deleteLayer}
        onUpdateLayer={store.updateLayer}
        visible={showLayerManager}
      />

      {/* ── COMMAND BAR ── */}
      <CADCommandBar
        hint={toolRef.current?.getHint?.()}
        activeTool={store.activeTool}
        onCommand={handleCommand}
        onToolChange={handleCommandToolChange}
        onValueSubmit={handleValueSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}

// ─── TRANSFORM HELPERS ──────────────────────────────────────────
function applyTransform(result, store) {
  const selectedEnts = [];
  store.selectedIds.forEach(id => {
    const ent = store.entities.get(id);
    if (ent) selectedEnts.push(ent);
  });

  if (selectedEnts.length === 0) return;

  switch (result.type) {
    case 'move':
      for (const ent of selectedEnts) {
        const updates = {};
        if (ent.type === 'line') {
          updates.x1 = ent.x1 + result.dx;
          updates.y1 = ent.y1 + result.dy;
          updates.x2 = ent.x2 + result.dx;
          updates.y2 = ent.y2 + result.dy;
        } else if (ent.type === 'circle' || ent.type === 'arc') {
          updates.cx = ent.cx + result.dx;
          updates.cy = ent.cy + result.dy;
        } else if (ent.type === 'rectangle' || ent.type === 'text') {
          updates.x = ent.x + result.dx;
          updates.y = ent.y + result.dy;
        } else if (ent.type === 'polyline' || ent.type === 'polygon') {
          updates.points = ent.points.map(p => ({
            x: p.x + result.dx,
            y: p.y + result.dy,
          }));
        }
        store.updateEntity(ent.id, updates);
      }
      break;

    case 'rotate':
      for (const ent of selectedEnts) {
        rotateEntity(ent, result.basePoint, result.angle, store);
      }
      break;

    case 'scale':
      for (const ent of selectedEnts) {
        scaleEntity(ent, result.basePoint, result.factor, store);
      }
      break;
  }
}

function rotatePoint(px, py, cx, cy, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = px - cx;
  const dy = py - cy;
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
  };
}

function rotateEntity(ent, base, angle, store) {
  const updates = {};
  switch (ent.type) {
    case 'line': {
      const p1 = rotatePoint(ent.x1, ent.y1, base.x, base.y, angle);
      const p2 = rotatePoint(ent.x2, ent.y2, base.x, base.y, angle);
      updates.x1 = p1.x; updates.y1 = p1.y;
      updates.x2 = p2.x; updates.y2 = p2.y;
      break;
    }
    case 'circle':
    case 'arc': {
      const c = rotatePoint(ent.cx, ent.cy, base.x, base.y, angle);
      updates.cx = c.x; updates.cy = c.y;
      if (ent.type === 'arc') {
        updates.startAngle = ent.startAngle + angle;
        updates.endAngle = ent.endAngle + angle;
      }
      break;
    }
    case 'rectangle':
    case 'text': {
      const p = rotatePoint(ent.x, ent.y, base.x, base.y, angle);
      updates.x = p.x; updates.y = p.y;
      if (ent.type === 'text') updates.angle = (ent.angle || 0) + angle;
      break;
    }
    case 'polyline':
    case 'polygon':
      updates.points = ent.points.map(p => rotatePoint(p.x, p.y, base.x, base.y, angle));
      break;
  }
  store.updateEntity(ent.id, updates);
}

function scaleEntity(ent, base, factor, store) {
  const sp = (px, py) => ({
    x: base.x + (px - base.x) * factor,
    y: base.y + (py - base.y) * factor,
  });

  const updates = {};
  switch (ent.type) {
    case 'line': {
      const p1 = sp(ent.x1, ent.y1);
      const p2 = sp(ent.x2, ent.y2);
      updates.x1 = p1.x; updates.y1 = p1.y;
      updates.x2 = p2.x; updates.y2 = p2.y;
      break;
    }
    case 'circle':
    case 'arc': {
      const c = sp(ent.cx, ent.cy);
      updates.cx = c.x; updates.cy = c.y;
      updates.radius = ent.radius * factor;
      break;
    }
    case 'rectangle': {
      const p = sp(ent.x, ent.y);
      updates.x = p.x; updates.y = p.y;
      updates.width = ent.width * factor;
      updates.height = ent.height * factor;
      break;
    }
    case 'text': {
      const p = sp(ent.x, ent.y);
      updates.x = p.x; updates.y = p.y;
      updates.fontSize = ent.fontSize * factor;
      break;
    }
    case 'polyline':
    case 'polygon':
      updates.points = ent.points.map(p => sp(p.x, p.y));
      break;
  }
  store.updateEntity(ent.id, updates);
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── STYLES ─────────────────────────────────────────────────────
const styles = {
  root: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    backgroundColor: '#0d1117',
    fontFamily: '"Inter", "Segoe UI", sans-serif',
  },
  menuBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: '#161b22',
    borderBottom: '1px solid #30363d',
    display: 'flex',
    alignItems: 'center',
    zIndex: 200,
    paddingLeft: 12,
    gap: 0,
  },
  appTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#e6edf3',
    fontSize: 14,
    fontWeight: 700,
    marginRight: 16,
    padding: '0 8px',
    letterSpacing: '-0.02em',
  },
  appIcon: {
    color: '#58a6ff',
    fontSize: 20,
  },
  menuItemWrapper: {
    position: 'relative',
  },
  menuItem: {
    padding: '6px 12px',
    color: '#8b949e',
    fontSize: 13,
    cursor: 'pointer',
    borderRadius: 6,
    transition: 'all 0.1s',
    userSelect: 'none',
  },
  menuItemOpen: {
    backgroundColor: '#1e2730',
    color: '#e6edf3',
  },
  menuDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 4,
    backgroundColor: '#1c2128',
    border: '1px solid #30363d',
    borderRadius: 8,
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    minWidth: 200,
    padding: '4px 0',
    zIndex: 300,
  },
  menuDropdownItem: {
    padding: '7px 16px',
    color: '#e6edf3',
    fontSize: 13,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'background 0.08s',
  },
  menuShortcut: {
    color: '#484f58',
    fontSize: 11,
    fontFamily: '"JetBrains Mono", monospace',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#21262d',
    margin: '4px 12px',
  },
  menuRight: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    paddingRight: 16,
  },
  layerIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: '#8b949e',
    fontSize: 12,
    fontFamily: '"JetBrains Mono", monospace',
  },
  layerDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    border: '1px solid #30363d',
  },
  entityCount: {
    color: '#484f58',
    fontSize: 11,
    fontFamily: '"JetBrains Mono", monospace',
  },
};
