// ============================================================
// Collaborative Whiteboard — React + Konva + Yjs
// Phase 1 & 2: Drawing, Sync, Cursors, Shapes, Pan/Zoom, Undo
// ============================================================

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer, Line, Rect, Ellipse, Circle, Text, Group } from 'react-konva';
import * as Y from 'yjs';
import { io } from 'socket.io-client';
import {
  Routes, Route, useNavigate, useParams, Navigate
} from 'react-router-dom';
import {
  Pencil, Square, CircleIcon, Trash2,
  Undo2, Redo2, RotateCcw, MousePointer2,
  Minus, Plus, Palette, Link, Check, StickyNote, X
} from 'lucide-react';
import { Html } from 'react-konva-utils';
import './index.css';

// --- Server URL ---
const SERVER_URL = import.meta.env.VITE_WS_URL || 'http://localhost:1234';

// --- Constants ---
const NOTE_WIDTH = 200;
const NOTE_HEIGHT = 150;

// --- Random Helpers ---
const generateRoomId = () => 'room-' + Math.random().toString(36).substring(2, 10);

function generateUser() {
  const id = Math.floor(Math.random() * 9000) + 1000;
  const colors = [
    '#6366f1', '#ec4899', '#f59e0b', '#10b981',
    '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6',
    '#f97316', '#06b6d4', '#84cc16', '#e879f9',
  ];
  return {
    name: `User-${id}`,
    color: colors[Math.floor(Math.random() * colors.length)],
    id: `user-${id}-${Date.now()}`,
  };
}

const currentUser = generateUser();

// --- Throttle Helper ---
function throttle(fn, delay) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      fn.apply(this, args);
    }
  };
}

// --- Sticky Note Item Component ---
function StickyNoteItem({ id, noteMap, onDelete }) {
  const [x, setX] = useState(noteMap.get('x'));
  const [y, setY] = useState(noteMap.get('y'));
  const [text, setText] = useState(noteMap.get('textContent').toString());
  const textareaRef = useRef(null);

  useEffect(() => {
    const observeHandler = () => {
      setX(noteMap.get('x'));
      setY(noteMap.get('y'));
      setText(noteMap.get('textContent').toString());
    };
    noteMap.observeDeep(observeHandler);
    return () => noteMap.unobserveDeep(observeHandler);
  }, [noteMap]);

  const handleInput = (e) => {
    const newText = e.target.value;
    const yText = noteMap.get('textContent');
    yText.doc.transact(() => {
      yText.delete(0, yText.length);
      yText.insert(0, newText);
    }, 'local');
  };

  const handleDragEnd = (e) => {
    noteMap.doc.transact(() => {
      noteMap.set('x', e.target.x());
      noteMap.set('y', e.target.y());
    }, 'local');
  };

  return (
    <Group
      x={x}
      y={y}
      draggable
      onDragEnd={handleDragEnd}
    >
      <Rect
        width={NOTE_WIDTH}
        height={NOTE_HEIGHT}
        fill={noteMap.get('backgroundColor') || '#fef08a'}
        cornerRadius={8}
        shadowBlur={10}
        shadowOpacity={0.1}
        shadowOffset={{ x: 0, y: 4 }}
      />
      <Html
        divProps={{
          style: {
            width: NOTE_WIDTH,
            height: NOTE_HEIGHT,
            padding: 0,
            margin: 0,
            pointerEvents: 'none',
          }
        }}
      >
        <div className="sticky-note-container">
          <textarea
            ref={textareaRef}
            className="sticky-note-textarea"
            value={text}
            onInput={handleInput}
            placeholder="Type something..."
          />
          <div
            className="sticky-note-delete"
            onPointerDown={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
          >
            <X size={14} />
          </div>
        </div>
      </Html>
    </Group>
  );
}

function Whiteboard() {
  const { roomId } = useParams();
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [shapes, setShapes] = useState([]);
  const [stickyNotes, setStickyNotes] = useState({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState(null);

  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);

  const [remoteCursors, setRemoteCursors] = useState({});
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [connected, setConnected] = useState(false);
  const [userCount, setUserCount] = useState(1);
  const [copied, setCopied] = useState(false);

  const stageRef = useRef(null);
  const ydocRef = useRef(null);
  const yArrayRef = useRef(null);
  const yNotesRef = useRef(null);
  const socketRef = useRef(null);
  const undoManagerRef = useRef(null);
  const panStartRef = useRef(null);
  const drawStartRef = useRef(null);

  // Update page title
  useEffect(() => {
    document.title = `Whiteboard — ${roomId}`;
  }, [roomId]);

  useEffect(() => {
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const yLines = ydoc.getArray('lines');
    yArrayRef.current = yLines;

    const yNotes = ydoc.getMap('stickyNotes');
    yNotesRef.current = yNotes;

    const undoManager = new Y.UndoManager([yLines, yNotes], {
      trackedOrigins: new Set(['local']),
    });
    undoManagerRef.current = undoManager;

    const updateUndoState = () => {
      setCanUndo(undoManager.canUndo());
      setCanRedo(undoManager.canRedo());
    };
    undoManager.on('stack-item-added', updateUndoState);
    undoManager.on('stack-item-popped', updateUndoState);

    const socket = io(SERVER_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`[WS] Connected to room: ${roomId}`);
      setConnected(true);
      socket.emit('join-room', roomId);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('yjs-sync', (stateBase64) => {
      const state = new Uint8Array(
        atob(stateBase64).split('').map(c => c.charCodeAt(0))
      );
      Y.applyUpdate(ydoc, state);
    });

    socket.on('yjs-update', (updateBase64) => {
      const update = new Uint8Array(
        atob(updateBase64).split('').map(c => c.charCodeAt(0))
      );
      Y.applyUpdate(ydoc, update, 'remote');
    });

    ydoc.on('update', (update, origin) => {
      if (origin === 'local') {
        const base64 = btoa(String.fromCharCode(...update));
        socket.emit('yjs-update', base64);
      }
    });

    const observeHandler = () => {
      setShapes(yLines.toArray());
    };
    yLines.observeDeep(observeHandler);
    observeHandler();

    const observeNotes = () => {
      const notes = {};
      yNotes.forEach((val, key) => {
        notes[key] = val; // val is a Y.Map now
      });
      setStickyNotes(notes);
    };
    yNotes.observeDeep(observeNotes);
    observeNotes();

    socket.on('awareness-update', (data) => {
      setRemoteCursors(prev => ({
        ...prev,
        [data.clientId]: data.cursor,
      }));
    });

    socket.on('awareness-remove', (clientId) => {
      setRemoteCursors(prev => {
        const next = { ...prev };
        delete next[clientId];
        return next;
      });
    });

    return () => {
      socket.disconnect();
      ydoc.destroy();
      undoManager.destroy();
    };
  }, [roomId]);

  useEffect(() => {
    setUserCount(Object.keys(remoteCursors).length + 1);
  }, [remoteCursors]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setSpaceHeld(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoManagerRef.current?.undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        undoManagerRef.current?.redo();
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setSpaceHeld(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const broadcastCursor = useCallback(
    throttle((pos) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('awareness-update', {
          cursor: {
            x: pos.x,
            y: pos.y,
            name: currentUser.name,
            color: currentUser.color,
          },
        });
      }
    }, 40),
    []
  );

  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    const direction = e.evt.deltaY < 0 ? 1 : -1;
    const factor = 1.08;
    let newScale = direction > 0 ? oldScale * factor : oldScale / factor;
    newScale = Math.max(0.1, Math.min(5, newScale));

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setStageScale(newScale);
    setStagePos(newPos);
  }, [stageScale, stagePos]);

  const getRelativePointerPos = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return null;
    return stage.getRelativePointerPosition();
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (spaceHeld || e.evt.button === 1) {
      setIsPanning(true);
      const pointer = stageRef.current.getPointerPosition();
      panStartRef.current = {
        x: pointer.x - stagePos.x,
        y: pointer.y - stagePos.y,
      };
      return;
    }

    if (e.evt.button !== 0) return;

    const pos = getRelativePointerPos();
    if (!pos) return;

    // Sticky Note Creation
    if (tool === 'note') {
      const id = 'note-' + Date.now();
      const ydoc = ydocRef.current;
      const yNotes = yNotesRef.current;

      ydoc.transact(() => {
        const noteMap = new Y.Map();
        noteMap.set('id', id);
        noteMap.set('x', pos.x - NOTE_WIDTH / 2);
        noteMap.set('y', pos.y - NOTE_HEIGHT / 2);
        noteMap.set('backgroundColor', '#fef08a');
        noteMap.set('textContent', new Y.Text());
        yNotes.set(id, noteMap);
      }, 'local');
      // No more auto-reverting tool, let user place multiple notes
      return;
    }

    setIsDrawing(true);
    drawStartRef.current = pos;

    if (tool === 'pen') {
      setCurrentShape({ type: 'line', points: [pos.x, pos.y], color, strokeWidth });
    } else if (tool === 'rect') {
      setCurrentShape({ type: 'rect', x: pos.x, y: pos.y, width: 0, height: 0, color, strokeWidth });
    } else if (tool === 'circle') {
      setCurrentShape({ type: 'circle', x: pos.x, y: pos.y, radiusX: 0, radiusY: 0, color, strokeWidth });
    }
  }, [tool, color, strokeWidth, spaceHeld, stagePos, getRelativePointerPos]);

  const handleMouseMove = useCallback((e) => {
    const stage = stageRef.current;
    if (!stage) return;

    const relPos = getRelativePointerPos();
    if (relPos) broadcastCursor(relPos);

    if (isPanning) {
      const pointer = stage.getPointerPosition();
      if (panStartRef.current) {
        setStagePos({
          x: pointer.x - panStartRef.current.x,
          y: pointer.y - panStartRef.current.y,
        });
      }
      return;
    }

    if (!isDrawing || !currentShape) return;

    const pos = getRelativePointerPos();
    if (!pos) return;

    if (tool === 'pen') {
      setCurrentShape(prev => ({
        ...prev,
        points: [...prev.points, pos.x, pos.y],
      }));
    } else if (tool === 'rect') {
      const start = drawStartRef.current;
      setCurrentShape(prev => ({
        ...prev,
        x: Math.min(start.x, pos.x),
        y: Math.min(start.y, pos.y),
        width: Math.abs(pos.x - start.x),
        height: Math.abs(pos.y - start.y),
      }));
    } else if (tool === 'circle') {
      const start = drawStartRef.current;
      setCurrentShape(prev => ({
        ...prev,
        x: (start.x + pos.x) / 2,
        y: (start.y + pos.y) / 2,
        radiusX: Math.abs(pos.x - start.x) / 2,
        radiusY: Math.abs(pos.y - start.y) / 2,
      }));
    }
  }, [isDrawing, isPanning, currentShape, tool, broadcastCursor, getRelativePointerPos]);

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
      return;
    }

    if (!isDrawing || !currentShape) {
      setIsDrawing(false);
      return;
    }

    const ydoc = ydocRef.current;
    const yLines = yArrayRef.current;
    if (ydoc && yLines) {
      ydoc.transact(() => {
        yLines.push([{ ...currentShape }]);
      }, 'local');
    }

    setIsDrawing(false);
    setCurrentShape(null);
  }, [isDrawing, isPanning, currentShape]);

  const handleClear = useCallback(() => {
    const ydoc = ydocRef.current;
    const yLines = yArrayRef.current;
    const yNotes = yNotesRef.current;
    if (ydoc && yLines) {
      ydoc.transact(() => {
        yLines.delete(0, yLines.length);
        if (yNotes) yNotes.clear();
      }, 'local');
    }
  }, []);

  const resetView = useCallback(() => {
    setStagePos({ x: 0, y: 0 });
    setStageScale(1);
  }, []);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const deleteNote = useCallback((id) => {
    const yNotes = yNotesRef.current;
    if (!yNotes) return;
    yNotes.doc.transact(() => {
      yNotes.delete(id);
    }, 'local');
  }, []);

  const renderedShapes = useMemo(() => {
    return shapes.map((shape, i) => {
      if (!shape) return null;
      switch (shape.type) {
        case 'line':
          return (
            <Line
              key={i}
              points={shape.points}
              stroke={shape.color}
              strokeWidth={shape.strokeWidth}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              listening={false}
            />
          );
        case 'rect':
          return (
            <Rect
              key={i}
              x={shape.x}
              y={shape.y}
              width={shape.width}
              height={shape.height}
              stroke={shape.color}
              strokeWidth={shape.strokeWidth}
              listening={false}
            />
          );
        case 'circle':
          return (
            <Ellipse
              key={i}
              x={shape.x}
              y={shape.y}
              radiusX={shape.radiusX}
              radiusY={shape.radiusY}
              stroke={shape.color}
              strokeWidth={shape.strokeWidth}
              listening={false}
            />
          );
        default: return null;
      }
    });
  }, [shapes]);

  const zoomPercent = Math.round(stageScale * 100);

  return (
    <div
      className={`canvas-container ${spaceHeld || isPanning ? 'panning' : ''}`}
      style={{
        backgroundPosition: `${stagePos.x}px ${stagePos.y}px`,
        backgroundSize: `${20 * stageScale}px ${20 * stageScale}px, ${20 * stageScale}px ${20 * stageScale}px, ${100 * stageScale}px ${100 * stageScale}px, ${100 * stageScale}px ${100 * stageScale}px`,
      }}
    >
      {/* ====== TOOLBAR ====== */}
      <div className="toolbar">
        <div className="toolbar-section">
          <span className="toolbar-label">Tools</span>
          <button className={`tool-btn ${tool === 'pen' ? 'active' : ''}`} onClick={() => setTool('pen')} title="Pen">
            <Pencil size={18} />
          </button>
          <button className={`tool-btn ${tool === 'rect' ? 'active' : ''}`} onClick={() => setTool('rect')} title="Rectangle">
            <Square size={18} />
          </button>
          <button className={`tool-btn ${tool === 'circle' ? 'active' : ''}`} onClick={() => setTool('circle')} title="Circle">
            <CircleIcon size={18} />
          </button>
          <button className={`tool-btn ${tool === 'note' ? 'active' : ''}`} onClick={() => setTool('note')} title="Sticky Note">
            <StickyNote size={18} />
          </button>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-section">
          <span className="toolbar-label">Color</span>
          <div className="color-picker-wrapper">
            <div className="color-picker-swatch" style={{ background: color }} />
            <input type="color" className="color-picker-input" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-section">
          <span className="toolbar-label">Size</span>
          <div className="stroke-slider-wrapper">
            <Minus size={10} color="rgba(255,255,255,0.3)" />
            <input type="range" className="stroke-slider" min={1} max={20} value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} />
            <Plus size={10} color="rgba(255,255,255,0.3)" />
            <span className="stroke-value">{strokeWidth}px</span>
          </div>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-section">
          <span className="toolbar-label">History</span>
          <button className="tool-btn" onClick={() => undoManagerRef.current?.undo()} disabled={!canUndo} title="Undo">
            <Undo2 size={18} />
          </button>
          <button className="tool-btn" onClick={() => undoManagerRef.current?.redo()} disabled={!canRedo} title="Redo">
            <Redo2 size={18} />
          </button>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-section">
          <span className="toolbar-label">Share</span>
          <button className="tool-btn" onClick={handleCopyLink} title="Copy Link">
            {copied ? <Check size={18} color="#22c55e" /> : <Link size={18} />}
          </button>
          {copied && <div className="tooltip">Copied!</div>}
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-section">
          <button className="tool-btn danger" onClick={handleClear} title="Clear All">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="connection-status">
        <div className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
        <span className="status-text">{connected ? 'Live' : 'Offline'}</span>
        <span className="user-count">{userCount} {userCount === 1 ? 'user' : 'users'}</span>
      </div>

      <div className="zoom-indicator">
        <button className="zoom-btn" onClick={() => setStageScale(s => Math.max(0.1, s / 1.2))}><Minus size={14} /></button>
        <span className="zoom-value">{zoomPercent}%</span>
        <button className="zoom-btn" onClick={() => setStageScale(s => Math.min(5, s * 1.2))}><Plus size={14} /></button>
        <button className="zoom-btn" onClick={resetView} title="Reset View"><RotateCcw size={13} /></button>
      </div>

      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={stageScale}
        scaleY={stageScale}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Layer listening={false}>{renderedShapes}</Layer>
        <Layer>
          {Object.entries(stickyNotes).map(([id, noteMap]) => (
            <StickyNoteItem key={id} id={id} noteMap={noteMap} onDelete={deleteNote} />
          ))}
          {currentShape && (
            currentShape.type === 'line' ? <Line points={currentShape.points} stroke={currentShape.color} strokeWidth={currentShape.strokeWidth} tension={0.5} lineCap="round" lineJoin="round" /> :
            currentShape.type === 'rect' ? <Rect x={currentShape.x} y={currentShape.y} width={currentShape.width} height={currentShape.height} stroke={currentShape.color} strokeWidth={currentShape.strokeWidth} dash={[6, 3]} /> :
            <Ellipse x={currentShape.x} y={currentShape.y} radiusX={currentShape.radiusX} radiusY={currentShape.radiusY} stroke={currentShape.color} strokeWidth={currentShape.strokeWidth} dash={[6, 3]} />
          )}
          {Object.entries(remoteCursors).map(([clientId, cursor]) => (
            cursor && (
              <Group key={clientId}>
                <Circle x={cursor.x} y={cursor.y} radius={6 / stageScale} fill={cursor.color} opacity={0.9} />
                <Circle x={cursor.x} y={cursor.y} radius={10 / stageScale} stroke={cursor.color} strokeWidth={1.5 / stageScale} opacity={0.4} />
                <Text x={cursor.x + 14 / stageScale} y={cursor.y + 4 / stageScale} text={cursor.name} fontSize={12 / stageScale} fill={cursor.color} fontFamily="Inter, sans-serif" fontStyle="600" />
              </Group>
            )
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/${generateRoomId()}`} replace />} />
      <Route path="/:roomId" element={<Whiteboard />} />
    </Routes>
  );
}
