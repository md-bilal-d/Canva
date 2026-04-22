// useCadStore.js — Custom React hook for CAD document state management
// No external state libraries — pure React hooks

import { useState, useCallback, useRef } from 'react';
import { generateId } from './cadGeometry.js';

const MAX_HISTORY = 50;

const DEFAULT_LAYERS = [
  { name: '0', color: '#e6edf3', visible: true, locked: false, lineType: 'continuous' },
  { name: 'Construction', color: '#58a6ff', visible: true, locked: false, lineType: 'dashed' },
  { name: 'Dimensions', color: '#3fb950', visible: true, locked: false, lineType: 'continuous' },
  { name: 'Annotations', color: '#d29922', visible: true, locked: false, lineType: 'continuous' },
  { name: 'Hidden', color: '#ff7b72', visible: true, locked: false, lineType: 'dashed' },
];

const DEFAULT_SNAP_SETTINGS = {
  grid: true,
  endpoint: true,
  midpoint: true,
  center: true,
  intersection: true,
  quadrant: true,
  perpendicular: false,
  tangent: false,
  nearest: false,
};

function createSnapshot(entities, selectedIds) {
  const entSnapshot = {};
  entities.forEach((val, key) => {
    entSnapshot[key] = { ...val };
  });
  return {
    entities: entSnapshot,
    selectedIds: [...selectedIds],
  };
}

function restoreSnapshot(snapshot) {
  const entities = new Map();
  for (const [key, val] of Object.entries(snapshot.entities)) {
    entities.set(key, { ...val });
  }
  return {
    entities,
    selectedIds: new Set(snapshot.selectedIds),
  };
}

export default function useCadStore() {
  const [entities, setEntities] = useState(() => new Map());
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [activeLayer, setActiveLayer] = useState('0');
  const [activeTool, setActiveTool] = useState('select');
  const [viewState, setViewState] = useState({ panX: 0, panY: 0, zoom: 1 });
  const [snapSettings, setSnapSettings] = useState(DEFAULT_SNAP_SETTINGS);
  const [units, setUnits] = useState('mm');
  const [gridSize, setGridSize] = useState(10);
  const [precision, setPrecision] = useState(2);

  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

  // ─── HISTORY (undo/redo) ──────────────────────────────────────
  const pushHistory = useCallback(() => {
    setEntities(ents => {
      setSelectedIds(sel => {
        const snap = createSnapshot(ents, sel);
        const h = historyRef.current;
        // Truncate any redo states
        historyRef.current = h.slice(0, historyIndexRef.current + 1);
        historyRef.current.push(snap);
        if (historyRef.current.length > MAX_HISTORY) {
          historyRef.current.shift();
        }
        historyIndexRef.current = historyRef.current.length - 1;
        return sel;
      });
      return ents;
    });
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const snap = historyRef.current[historyIndexRef.current];
    const restored = restoreSnapshot(snap);
    setEntities(restored.entities);
    setSelectedIds(restored.selectedIds);
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const snap = historyRef.current[historyIndexRef.current];
    const restored = restoreSnapshot(snap);
    setEntities(restored.entities);
    setSelectedIds(restored.selectedIds);
  }, []);

  // ─── ENTITY OPERATIONS ────────────────────────────────────────
  const addEntity = useCallback((entity) => {
    pushHistory();
    setEntities(prev => {
      const next = new Map(prev);
      const ent = { ...entity };
      if (!ent.id) ent.id = generateId();
      if (!ent.layer) ent.layer = activeLayer;
      next.set(ent.id, ent);
      return next;
    });
  }, [pushHistory, activeLayer]);

  const updateEntity = useCallback((id, changes) => {
    pushHistory();
    setEntities(prev => {
      const next = new Map(prev);
      const ent = next.get(id);
      if (ent) {
        next.set(id, { ...ent, ...changes });
      }
      return next;
    });
  }, [pushHistory]);

  const deleteEntity = useCallback((id) => {
    pushHistory();
    setEntities(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [pushHistory]);

  const deleteSelected = useCallback(() => {
    pushHistory();
    setEntities(prev => {
      const next = new Map(prev);
      for (const id of selectedIds) {
        next.delete(id);
      }
      return next;
    });
    setSelectedIds(new Set());
  }, [pushHistory, selectedIds]);

  // ─── SELECTION ────────────────────────────────────────────────
  const selectEntities = useCallback((ids) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(prev => {
      const next = new Set();
      entities.forEach((_, id) => next.add(id));
      return next;
    });
  }, [entities]);

  // ─── LAYERS ───────────────────────────────────────────────────
  const addLayer = useCallback((layer) => {
    setLayers(prev => [...prev, layer]);
  }, []);

  const deleteLayer = useCallback((name) => {
    if (name === '0') return; // Cannot delete default
    setLayers(prev => prev.filter(l => l.name !== name));
    if (activeLayer === name) setActiveLayer('0');
  }, [activeLayer]);

  const updateLayer = useCallback((name, changes) => {
    setLayers(prev => prev.map(l =>
      l.name === name ? { ...l, ...changes } : l
    ));
  }, []);

  // ─── VIEW STATE ───────────────────────────────────────────────
  const updateViewState = useCallback((changes) => {
    setViewState(prev => ({ ...prev, ...changes }));
  }, []);

  // ─── IMPORT / EXPORT (stubs) ──────────────────────────────────
  const importDXF = useCallback((content) => {
    console.log('DXF Import — stub. Content length:', content?.length);
  }, []);

  const exportDXF = useCallback(() => {
    console.log('DXF Export — stub. Entity count:', entities.size);
    return '';
  }, [entities]);

  const newDocument = useCallback(() => {
    setEntities(new Map());
    setSelectedIds(new Set());
    setLayers(DEFAULT_LAYERS);
    setActiveLayer('0');
    setActiveTool('select');
    setViewState({ panX: 0, panY: 0, zoom: 1 });
    historyRef.current = [];
    historyIndexRef.current = -1;
  }, []);

  return {
    // State
    entities,
    selectedIds,
    layers,
    activeLayer,
    activeTool,
    viewState,
    snapSettings,
    units,
    gridSize,
    precision,

    // Entity actions
    addEntity,
    updateEntity,
    deleteEntity,
    deleteSelected,

    // Selection actions
    selectEntities,
    clearSelection,
    toggleSelect,
    selectAll,

    // Tool
    setActiveTool,

    // Undo/redo
    undo,
    redo,

    // View
    setViewState: updateViewState,

    // Layers
    setActiveLayer,
    addLayer,
    deleteLayer,
    updateLayer,
    setLayers,

    // Settings
    setSnapSettings,
    setUnits,
    setGridSize,
    setPrecision,

    // Document
    newDocument,
    importDXF,
    exportDXF,
  };
}
