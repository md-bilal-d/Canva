// ============================================================
// Collaborative Whiteboard — React + Konva + Yjs
// Phase 1 & 2: Drawing, Sync, Cursors, Shapes, Pan/Zoom, Undo
// ============================================================

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer, Line, Rect, Ellipse, Circle, Text, Group, Transformer } from 'react-konva';
import * as Y from 'yjs';
import { io } from 'socket.io-client';
import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import AvatarStack from './components/AvatarStack.jsx';
import UserProfile from './components/UserProfile.jsx';
import useCurrentUser from './hooks/useCurrentUser.js';
import GuestBanner from './components/GuestBanner.jsx';
import TemplatesModal from './components/TemplatesModal.jsx';
import EmojiPicker from './components/EmojiPicker.jsx';
import FloatingEmoji from './components/FloatingEmoji.jsx';
import useEmojiReactions from './hooks/useEmojiReactions.js';
import { 
  Pencil, Square, CircleIcon, Trash2,
  Undo2, Redo2, RotateCcw, MousePointer2,
  Minus, Plus, Palette, Link, Check, StickyNote, X, Download,
  LayoutTemplate, Phone, GitCommit, Sparkles, Network, Presentation, Box, Highlighter, Zap, Code, Ruler, Grid3X3, Globe, Compass, Gamepad2, Layers, MoveRight, Lock, Unlock, Calendar,
  Clock, Users, ImageIcon, LayoutGrid, Type, Workflow, Minimize2, Maximize2, Video as VideoIcon, Wand2, QrCode, Music, BarChart3 as PollIcon, ListTodo,
  MessageSquare, BrainCircuit, Calculator
} from 'lucide-react';
import useConnectors, { computeConnectorPoints, getShapeEdgePoints } from './hooks/useConnectors.js';
import CallPanel from './components/CallPanel.jsx';
import AISidebar from './components/AISidebar.jsx';
import ScenePanel from './components/ScenePanel.jsx';
import LayersPanel from './components/LayersPanel.jsx';
import DynamicBackground from './components/DynamicBackground.jsx';
import CursorChat from './components/CursorChat.jsx';
import CanvasImage from './components/CanvasImage.jsx';
import HistoryScrubber from './components/HistoryScrubber.jsx';
import CodeExportPanel from './components/CodeExportPanel.jsx';
import Minimap from './components/Minimap.jsx';
import PhysicsWorld from './components/PhysicsWorld.jsx';
import ActivityHeatmap from './components/ActivityHeatmap.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import DimensionLine from './components/DimensionLine.jsx';
import CommentIndicator from './components/CommentIndicator.jsx';
import CommentThread from './components/CommentThread.jsx';
import KanbanBoard from './components/KanbanBoard.jsx';
import useComments from './hooks/useComments.js';
import useMentions from './hooks/useMentions.js';
import useNotifications from './hooks/useNotifications.js';
import { Html } from 'react-konva-utils';
import ChartWidget from './components/ChartWidget.jsx';
import IframeWidget from './components/IframeWidget.jsx';
import VoiceControl from './components/VoiceControl.jsx';
import FrameShape from './components/FrameShape.jsx';
import PortalShape from './components/PortalShape.jsx';
import BrandKitSidebar from './components/BrandKitSidebar.jsx';
import { calculateLayoutUpdates, LAYOUT_TYPES } from './utils/LayoutEngine';
import ThemeToggle from './components/ThemeToggle.jsx';
import TimerWidget from './components/TimerWidget.jsx';
import AnalyticsPanel from './components/AnalyticsPanel.jsx';
import ShareModal from './components/ShareModal.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import Portal3D from './components/Portal3D.jsx';
import AutomationPanel from './components/AutomationPanel.jsx';
import RecordingService from './utils/RecordingService.js';
import useTheme from './hooks/useTheme.js';
import useSharedTimer from './hooks/useSharedTimer.js';
import useAnalytics from './hooks/useAnalytics.js';
import useBoardSettings from './hooks/useBoardSettings.js';
import AIImageStudio from './components/AIImageStudio.jsx';
import TicTacToeWidget from './components/TicTacToeWidget.jsx';
import CodeWidget from './components/CodeWidget.jsx';
import VideoWidget from './components/VideoWidget.jsx';
import ReactionWheel from './components/ReactionWheel.jsx';
import ThemeGenerator from './components/ThemeGenerator.jsx';
import useShapeRecognition from './hooks/useShapeRecognition.js';
import useUserProfile from './hooks/useUserProfile.js';
import usePolls from './hooks/usePolls.js';
import useAgenda from './hooks/useAgenda.js';
import PollWidget, { PollCreationModal } from './components/PollWidget.jsx';
import AgendaSidebar from './components/AgendaSidebar.jsx';
import Soundboard from './components/Soundboard.jsx';
import QRCodeWidget from './components/QRCodeWidget.jsx';
import GanttChartWidget from './components/GanttChartWidget.jsx';
import MindMapWidget from './components/MindMapWidget.jsx';
import ChatSidebar from './components/ChatSidebar.jsx';
import FlashcardWidget from './components/FlashcardWidget.jsx';
import CalculatorWidget from './components/CalculatorWidget.jsx';
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

const localUser = generateUser();

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

  const evaluateFormula = (val) => {
    if (val.startsWith('=')) {
        try {
            // Simple math evaluation
            const expression = val.substring(1);
            // Safety check: only allow numbers and basic math operators
            if (/^[0-9+\-*/().\s]+$/.test(expression)) {
                return eval(expression);
            }
            return "Err: Invalid";
        } catch (e) {
            return "Err: Syntax";
        }
    }
    return val;
  };

  const currentText = text || '';
  const isFormula = currentText.startsWith('=');
  const formulaResult = isFormula ? evaluateFormula(currentText) : null;

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
        <div className={`sticky-note-container ${isFormula ? 'formula-active' : ''}`}>
          <textarea
            ref={textareaRef}
            className="sticky-note-textarea"
            value={text}
            onInput={handleInput}
            placeholder="Type something..."
          />
          {isFormula && (
            <div className="absolute bottom-6 left-0 right-0 p-2 bg-indigo-600 text-white text-[10px] font-bold text-center pointer-events-none">
                RESULT: {formulaResult}
            </div>
          )}
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
  const [shapes, setShapes] = useState({});
  const [stickyNotes, setStickyNotes] = useState({});
  const [selectedId, setSelectedId] = useState(null);
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState(null);
  const [editingLabelText, setEditingLabelText] = useState('');
  const [incomingCall, setIncomingCall] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isScenesOpen, setIsScenesOpen] = useState(false);
  const [activeEmoji, setActiveEmoji] = useState(null);
  const [is3DEnabled, setIs3DEnabled] = useState(false);
  const [isPhysicsEnabled, setIsPhysicsEnabled] = useState(false);
  const [isHeatmapEnabled, setIsHeatmapEnabled] = useState(false);
  const [isSketchMode, setIsSketchMode] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isGridEnabled, setIsGridEnabled] = useState(false);
  const [isOrthogonalMode, setIsOrthogonalMode] = useState(false);
  const GRID_SIZE = 25;
  // Ref to track throttled physics updates
  const lastPhysicsSyncRef = useRef(0);
  
  // Phase 1 Features State
  const [isChatting, setIsChatting] = useState(false);
  const [chatText, setChatText] = useState('');
  const [cursorTrail, setCursorTrail] = useState([]);
  const [particles, setParticles] = useState([]);
  const particleIdRef = useRef(0);
  const [followUserId, setFollowUserId] = useState(null);
  const [isBroadcastingView, setIsBroadcastingView] = useState(false);
  const [momentumShapes, setMomentumShapes] = useState({}); // { id: { vx, vy } }
  const [isCodeExportOpen, setIsCodeExportOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [isBrandKitOpen, setIsBrandKitOpen] = useState(false);
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [isPollCreationOpen, setIsPollCreationOpen] = useState(false);
  const [isAgendaOpen, setIsAgendaOpen] = useState(false);
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [isAutomationOpen, setIsAutomationOpen] = useState(false);
  const [isAIImageOpen, setIsAIImageOpen] = useState(false);
  const [isTicTacToeOpen, setIsTicTacToeOpen] = useState(false);
  const [reactionWheelPos, setReactionWheelPos] = useState(null); // { x, y } screen coordinates
  const [isRecording, setIsRecording] = useState(false);
  const [isThemeGeneratorOpen, setIsThemeGeneratorOpen] = useState(false);
  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
  const [isBrainstormingMode, setIsBrainstormingMode] = useState(false);
  const [autoShapeEnabled, setAutoShapeEnabled] = useState(true);
  const recordingServiceRef = useRef(new RecordingService());

  const { recognize } = useShapeRecognition();


  const currentUserData = useCurrentUser();
  const currentUser = useMemo(() => {
    if (!currentUserData) return localUser;
    return {
      ...localUser,
      ...currentUserData
    };
  }, [currentUserData]);

  const stageRef = useRef(null);

  const [activeCommentThread, setActiveCommentThread] = useState(null); // { shapeId, pos }

  const providerRef = useRef({
    awareness: {
      listeners: [],
      states: new Map(),
      getLocalState: function() { return this.states.get('local') || { user: { name: currentUser.name } } },
      setLocalStateField: function(field, value) {
        const state = this.states.get('local') || {};
        state[field] = value;
        this.states.set('local', state);
        
        if (field === 'user' && value.name) currentUser.name = value.name;

        if (socketRef.current?.connected) {
           const stage = stageRef.current;
           const pos = stage ? stage.getRelativePointerPosition() : null;
           socketRef.current.emit('awareness-update', {
             clientId: 'local',
             cursor: {
               x: pos?.x || 0,
               y: pos?.y || 0,
               name: currentUser.name,
               color: currentUser.color,
             },
             emojiReaction: field === 'emojiReaction' ? value : state.emojiReaction,
             chatText: field === 'chatText' ? value : state.chatText,
             viewport: field === 'viewport' ? value : state.viewport,
             isPresenter: field === 'isPresenter' ? value : state.isPresenter
           });
        }
        this.listeners.forEach(fn => fn({ added: [], updated: ['local'], removed: [] }));
      },
      getStates: function() { return this.states; },
      on: function(event, fn) { if (event === 'change') this.listeners.push(fn); },
      off: function(event, fn) { if (event === 'change') this.listeners = this.listeners.filter(l => l !== fn); }
    }
  });

  const stackUsers = useMemo(() => {
    const local = { id: currentUser.id, clientId: 'local', name: currentUser.name, color: currentUser.color };
    const remotes = Object.entries(remoteCursors).map(([clientId, cursor]) => {
      const remoteState = providerRef.current.awareness.getStates().get(clientId);
      return {
        id: clientId,
        clientId,
        name: cursor.name,
        color: cursor.color,
        isPresenter: remoteState?.isPresenter
      };
    });
    return [local, ...remotes];
  }, [remoteCursors, providerRef.current.awareness]);

  const handleAvatarClick = useCallback((user) => {
    if (user.clientId === 'local') {
      setIsProfileOpen(prev => !prev);
    } else {
      const cursor = remoteCursors[user.clientId];
      const remoteState = providerRef.current.awareness.getStates().get(user.clientId);
      
      if (remoteState?.isPresenter && followUserId !== user.clientId) {
          // Start following the presenter
          setFollowUserId(user.clientId);
          setStageScale(remoteState.viewport?.scale || 1);
          setStagePos({ x: remoteState.viewport?.x || 0, y: remoteState.viewport?.y || 0 });
      } else if (cursor) {
          // Just jump to user
          setStagePos({ x: window.innerWidth / 2 - cursor.x * stageScale, y: window.innerHeight / 2 - cursor.y * stageScale });
          setFollowUserId(null); // Stop following if we manually jump
      }
    }
  }, [remoteCursors, stageScale, followUserId]);
  const transformerRef = useRef(null);
  const ydocRef = useRef(null);
  const [activeDoc, setActiveDoc] = useState(null);
  const yShapesRef = useRef(null);
  const yNotesRef = useRef(null);
  const socketRef = useRef(null);
  const undoManagerRef = useRef(null);
  const panStartRef = useRef(null);
  const drawStartRef = useRef(null);

  const { reactions, addReaction } = useEmojiReactions(activeDoc, providerRef.current, currentUser);
  const { connectors, addConnector, updateConnector, removeConnector, recalculateForShape } = useConnectors(activeDoc);
  const [connectingStart, setConnectingStart] = useState(null);
  const [activeConnector, setActiveConnector] = useState(null);

  // Collaboration Hooks
  const { 
    comments: allComments, 
    addComment, 
    resolveThread, 
    deleteComment, 
    unresolvedShapeIds 
  } = useComments(activeDoc);
  
  const { mentionCount, clearMentions } = useMentions(activeDoc, currentUser.name);
  const { unreadCount, notifications, markRead, markAllRead } = useNotifications(socketRef.current, currentUser.id);

  const { theme, toggleTheme, isDark } = useTheme();
  const timerProps = useSharedTimer(activeDoc, true);
  const { stats, loading: analyticsLoading } = useAnalytics(roomId);
  
  const {
    polls,
    createPoll,
    vote,
    closePoll,
    deletePoll,
    getVoteCount,
    getTotalVotes
  } = usePolls(activeDoc, currentUser.id);

  const {
    items: agendaItems,
    notes: agendaNotes,
    currentItemId,
    addItem: addAgendaItem,
    removeItem: removeAgendaItem,
    setCurrentItem: setAgendaCurrentItem,
    updateNotes: updateAgendaNotes,
    exportNotes: exportAgendaNotes
  } = useAgenda(activeDoc);

  const { settings, updateVisibility, inviteMember, removeMember, loading: settingsLoading } = useBoardSettings(roomId);

  useEffect(() => {
    document.title = `Whiteboard — ${roomId}`;
  }, [roomId]);

  useEffect(() => {
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    setActiveDoc(ydoc);

    const yShapes = ydoc.getMap('shapes');
    yShapesRef.current = yShapes;

    const yNotes = ydoc.getMap('stickyNotes');
    yNotesRef.current = yNotes;

    const undoManager = new Y.UndoManager([yShapes, yNotes], {
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

    const observeShapes = () => {
      const shapesMap = {};
      yShapes.forEach((val, key) => {
        if (val instanceof Y.Map) {
          const json = val.toJSON();
          shapesMap[key] = { ...json, _raw: val };
        } else {
          shapesMap[key] = val;
        }
      });
      setShapes(shapesMap);
    };
    yShapes.observeDeep(observeShapes);
    observeShapes();

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
      const aw = providerRef.current.awareness;
      const remoteState = aw.states.get(data.clientId) || {};
      if (data.emojiReaction) remoteState.emojiReaction = data.emojiReaction;
      else delete remoteState.emojiReaction;
      
      if (data.chatText) remoteState.chatText = data.chatText;
      else delete remoteState.chatText;

      if (data.viewport) remoteState.viewport = data.viewport;
      if (data.isPresenter !== undefined) remoteState.isPresenter = data.isPresenter;

      aw.states.set(data.clientId, remoteState);
      aw.listeners.forEach(fn => fn({ added: [], updated: [data.clientId], removed: [] }));
    });

    socket.on('awareness-remove', (clientId) => {
      setRemoteCursors(prev => {
        const next = { ...prev };
        delete next[clientId];
        return next;
      });
      const aw = providerRef.current.awareness;
      aw.states.delete(clientId);
      aw.listeners.forEach(fn => fn({ added: [], updated: [], removed: [clientId] }));
    });

    socket.on('call-user-joined', () => {
      // If we are not already in the call, show the incoming call prompt
      setIsCallOpen(prev => {
        if (!prev) {
          setIncomingCall(true);
        }
        return prev;
      });
    });

    socket.on('play-sound', (data) => {
      const audio = new Audio(data.url);
      audio.volume = 0.5;
      audio.play().catch(e => console.warn('Audio playback blocked:', e));
      
      // Spawn some visual feedback
      addReaction('🔊', window.innerWidth/2, window.innerHeight/2);
    });

    // Viewport Following Logic
    const handleAwarenessChange = () => {
        if (followUserId) {
            const states = providerRef.current.awareness.getStates();
            const leaderState = states.get(followUserId);
            if (leaderState?.viewport && leaderState?.isPresenter) {
                setStagePos({ x: leaderState.viewport.x, y: leaderState.viewport.y });
                setStageScale(leaderState.viewport.scale);
            } else if (!leaderState?.isPresenter) {
                setFollowUserId(null); // Leader stopped presenting
            }
        }
    };
    providerRef.current.awareness.on('change', handleAwarenessChange);

    return () => {
      socket.disconnect();
      ydoc.destroy();
      undoManager.destroy();
      providerRef.current.awareness.off('change', handleAwarenessChange);
    };
  }, [roomId, followUserId]);

  useEffect(() => {
    setUserCount(Object.keys(remoteCursors).length + 1);
  }, [remoteCursors]);

  // Handle Transformer Selection
  useEffect(() => {
    if (selectedId && transformerRef.current) {
      const selectedNode = stageRef.current.findOne('#' + selectedId);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      } else {
        transformerRef.current.nodes([]);
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedId, shapes]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent canvas shortcuts from interfering with typing in inputs/textareas
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setSpaceHeld(true);
      }
      if (e.code === 'Delete' || e.code === 'Backspace') {
        if (selectedId && tool === 'select') {
          const yShapes = yShapesRef.current;
          if (yShapes && yShapes.has(selectedId)) {
            yShapes.doc.transact(() => {
              yShapes.delete(selectedId);
            }, 'local');
            setSelectedId(null);
          }
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoManagerRef.current?.undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        undoManagerRef.current?.redo();
      }

      // Cursor Chat Toggle
      if (e.key === '/' && !isChatting) {
        e.preventDefault();
        setIsChatting(true);
      }

      // Command Palette Toggle
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }

      // Reaction Wheel Toggle
      if (e.key === 'e' || e.key === 'E') {
          if (!reactionWheelPos) {
              const pointer = stageRef.current?.getPointerPosition() || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
              setReactionWheelPos(pointer);
          } else {
              setReactionWheelPos(null);
          }
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

  // --- Automation Engine Logic ---
  useEffect(() => {
    if (!activeDoc || !yShapesRef.current) return;
    const yAuto = activeDoc.getMap('automations');
    
    const checkAutomations = () => {
      yAuto.forEach(rule => {
        if (!rule.active) return;
        
        // Trigger: enter_region (Simplified logic)
        if (rule.trigger === 'enter_region') {
            // Find a "Zone" shape (using label heuristic)
            let region = null;
            Object.values(shapes).forEach(s => {
                if (s.label?.toLowerCase().includes('zone')) region = s;
            });
            
            if (region) {
                Object.entries(shapes).forEach(([id, s]) => {
                    if (id === region.id || s.type === 'line') return;
                    
                    const isInside = (
                        s.x > region.x && 
                        s.x < region.x + (region.width || 400) && 
                        s.y > region.y && 
                        s.y < region.y + (region.height || 400)
                    );

                    if (isInside) {
                        // Action: change_color
                        if (rule.action === 'change_color' && s.color !== rule.value) {
                             activeDoc.transact(() => {
                                 yShapesRef.current.set(id, { ...s, color: rule.value });
                             }, 'local');
                        }
                        // Action: lock_object
                        if (rule.action === 'lock_object' && !s.isLocked) {
                            activeDoc.transact(() => {
                                yShapesRef.current.set(id, { ...s, isLocked: true });
                            }, 'local');
                        }
                    }
                });
            }
        }
      });
    };
    
    checkAutomations();
  }, [shapes, activeDoc]);

  // --- Cinematic Recording Logic ---
  useEffect(() => {
    if (!isRecording) return;
    
    const interval = setInterval(() => {
        recordingServiceRef.current.capture(
            { x: stagePos.x, y: stagePos.y, scale: stageScale },
            shapes,
            stickyNotes
        );
    }, 500); // Capture every 500ms
    
    return () => clearInterval(interval);
  }, [isRecording, stagePos, stageScale, shapes, stickyNotes]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      const emojiMap = { '1': '🎉', '2': '💖', '3': '🔥', '4': '👀', '5': '👍' };
      if (emojiMap[e.key]) {
          const stage = stageRef.current;
          if (stage) {
              let pointer = stage.getPointerPosition();
              if (!pointer) {
                  pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
              }
              const relX = (pointer.x - stagePos.x) / stageScale;
              const relY = (pointer.y - stagePos.y) / stageScale;
              addReaction(emojiMap[e.key], relX, relY);
          }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [addReaction, stagePos, stageScale]);

  const broadcastCursor = useCallback(
    throttle((pos) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('awareness-update', {
          cursor: {
            x: pos.x,
            y: pos.y,
            name: currentUser.name,
            color: currentUser.color,
            chatText: chatText
          },
        });
      }
    }, 40),
    [chatText, currentUser]
  );

  // Reaction Burst Logic
  const spawnReactionBurst = useCallback((emoji, x, y) => {
    const count = 12;
    const newParticles = [];
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const velocity = 2 + Math.random() * 4;
        newParticles.push({
            id: `p-${particleIdRef.current++}`,
            emoji,
            x,
            y,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            life: 1.0,
            rotation: Math.random() * 360,
            rv: (Math.random() - 0.5) * 20
        });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Update Particles and Trails
  useEffect(() => {
    let frameId;
    const update = () => {
        setParticles(prev => {
            if (prev.length === 0) return prev;
            return prev
                .map(p => ({
                    ...p,
                    x: p.x + p.vx,
                    y: p.y + p.vy,
                    vy: p.vy + 0.1, // gravity
                    life: p.life - 0.02,
                    rotation: p.rotation + p.rv
                }))
                .filter(p => p.life > 0);
        });
        frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const addReactionWithBurst = useCallback((emoji, x, y) => {
    addReaction(emoji, x, y);
    spawnReactionBurst(emoji, x, y);
  }, [addReaction, spawnReactionBurst]);

  const handleWheel = useCallback((e) => {
    // Ignore wheel events if we're hovering over a sticky note textarea so it can scroll
    if (e.evt.target.tagName === 'TEXTAREA' || e.evt.target.tagName === 'INPUT') {
      return;
    }

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

    if (isBroadcastingView) {
        providerRef.current.awareness.setLocalStateField('viewport', { x: newPos.x, y: newPos.y, scale: newScale });
    }
  }, [stageScale, stagePos, isBroadcastingView]);

  const toggleBroadcasting = useCallback(() => {
    const newState = !isBroadcastingView;
    setIsBroadcastingView(newState);
    providerRef.current.awareness.setLocalStateField('isPresenter', newState);
    if (newState) {
        providerRef.current.awareness.setLocalStateField('viewport', { x: stagePos.x, y: stagePos.y, scale: stageScale });
    }
  }, [isBroadcastingView, stagePos, stageScale]);

  const updateViewportPos = useCallback((pos) => {
    setStagePos(pos);
    if (isBroadcastingView) {
        providerRef.current.awareness.setLocalStateField('viewport', { ...pos, scale: stageScale });
    }
  }, [stageScale, isBroadcastingView]);

  const getRelativePointerPos = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pos = stage.getRelativePointerPosition();
    if (isGridEnabled) {
      return {
        x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE
      };
    }
    return pos;
  }, [isGridEnabled]);

  const handleTidyUp = useCallback((type = LAYOUT_TYPES.GRID) => {
    const selectedShapes = Object.values(shapes).filter(s => s.id === selectedId); // Fallback to single selection if needed
    // In a real app, we'd have a multi-select state. For now, let's tidy all or a specific group.
    
    const shapesToTidy = selectedId ? [shapes[selectedId]] : Object.values(shapes);
    if (shapesToTidy.length <= 1) return;

    const center = getRelativePointerPos() || { x: 500, y: 500 };
    const updates = calculateLayoutUpdates(shapesToTidy, type, center.x - 200, center.y - 200);

    activeDoc.transact(() => {
      updates.forEach(u => {
        const existing = yShapesRef.current.get(u.id);
        if (existing) {
          yShapesRef.current.set(u.id, { ...existing, x: u.x, y: u.y });
        }
      });
    }, 'local');
  }, [shapes, selectedId, activeDoc, getRelativePointerPos]);

  const handleTransitionTo = useCallback((scene) => {
    // Phase 1: Cinematic Fly-through Implementation
    // This adds a "zoom-out -> pan -> zoom-in" effect for a premium feel
    setIsTransitioning(true);
    
    const startPos = { ...stagePos };
    const startScale = stageScale;
    
    // Calculate distance to determine duration (longer distance = slower pan)
    const dx = scene.x - startPos.x;
    const dy = scene.y - startPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const baseDuration = 1000;
    const duration = Math.max(baseDuration, Math.min(2500, distance / 2));
    
    const startTime = Date.now();

    const animate = () => {
        const now = Date.now();
        const progress = Math.min(1, (now - startTime) / duration);
        
        // Easing: easeInOutCubic for smoother start/end
        const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const e = ease(progress);

        // Cinematic "Parallax" Scale Effect:
        // We dip the scale slightly in the middle of the transition to show context
        const midPointScaleDip = 0.85; // dip to 85% of target
        const scaleProgress = Math.sin(progress * Math.PI); // 0 at start, 1 at mid, 0 at end
        
        // Interpolate position
        const currentX = startPos.x + (scene.x - startPos.x) * e;
        const currentY = startPos.y + (scene.y - startPos.y) * e;
        
        // Interpolate scale with a slight dip in the middle
        const targetScale = startScale + (scene.scale - startScale) * e;
        const cinematicScale = targetScale * (1 - (scaleProgress * 0.15)); // max 15% dip

        setStagePos({ x: currentX, y: currentY });
        setStageScale(cinematicScale);
        setTransitionProgress(progress);

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Ensure we land exactly on target
            setStagePos({ x: scene.x, y: scene.y });
            setStageScale(scene.scale);
            setIsTransitioning(false);
            setTransitionProgress(0);
        }
    };

    requestAnimationFrame(animate);
  }, [stagePos, stageScale]);


  const handleMouseDown = useCallback((e) => {
    const pointer = stageRef.current.getPointerPosition();
    const relPos = getRelativePointerPos();
    if (activeEmoji && relPos && e.evt.button === 0 && !spaceHeld) {
      addReactionWithBurst(activeEmoji, relPos.x, relPos.y);
      return;
    }

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

    if (tool === 'select') {
      const clickedOnEmpty = e.target === e.target.getStage();
      const clickedOnShape = !clickedOnEmpty;
      
      // If clicked on a locked shape, ignore
      if (clickedOnShape) {
          const shapeId = e.target.id() || (e.target.getParent() && e.target.getParent().id());
          const shape = shapes[shapeId];
          if (shape && shape.locked) {
              setSelectedId(null);
              return;
          }
      }

      if (clickedOnEmpty) {
        setSelectedId(null);
      }
      return;
    }

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
    } else if (tool === 'dimension') {
      setCurrentShape({ type: 'dimension', points: [pos.x, pos.y, pos.x, pos.y], color, strokeWidth });
    } else if (tool === 'frame') {
      setCurrentShape({ type: 'frame', x: pos.x, y: pos.y, width: 0, height: 0, name: `Frame ${Object.keys(shapes).filter(id => shapes[id].type === 'frame').length + 1}` });
    } else if (tool === 'chart') {
      setCurrentShape({ type: 'chart', x: pos.x, y: pos.y, width: 0, height: 0 });
    } else if (tool === 'iframe') {
      setCurrentShape({ type: 'iframe', x: pos.x, y: pos.y, width: 0, height: 0 });
    } else if (tool === 'video') {
      setCurrentShape({ type: 'video_widget', x: pos.x, y: pos.y, width: 0, height: 0 });
    } else if (tool === 'portal') {
      // Create a portal that links to a far-away part of the canvas by default
      const id = 'portal-' + Date.now();
      const yShapes = yShapesRef.current;
      yShapes.doc.transact(() => {
          yShapes.set(id, {
              id,
              type: 'portal',
              x: pos.x,
              y: pos.y,
              name: 'New Dimension',
              targetX: pos.x + 1500, // Teleport away
              targetY: pos.y + 1500,
              targetScale: 1.2
          });
      }, 'local');
      setIsDrawing(false);
      setTool('select');
      return;
    } else if (tool === 'gantt') {
      setCurrentShape({ type: 'gantt', x: pos.x, y: pos.y, width: 0, height: 0 });
    } else if (tool === 'kanban') {
      setCurrentShape({ type: 'kanban', x: pos.x, y: pos.y, width: 0, height: 0 });
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

        if (is3DEnabled) {
          const centerX = window.innerWidth / 2;
          const centerY = window.innerHeight / 2;
          const tx = (pointer.y - centerY) / 80;
          const ty = (centerX - pointer.x) / 80;
          setTilt({ x: tx, y: ty });
        }
      }
      return;
    }

    // Ghost Trails logic
    const pointer = stage.getPointerPosition();
    if (pointer) {
        setCursorTrail(prev => {
            const next = [{ x: pointer.x, y: pointer.y, id: Date.now() }, ...prev];
            return next.slice(0, 15); // Keep last 15 positions
        });
    }

    const findNearestSnapPoint = (pos) => {
      let nearest = null;
      let minDist = 40; // Snap radius
      
      Object.entries(shapes).forEach(([id, shape]) => {
        const edges = getShapeEdgePoints(shape);
        edges.forEach(edge => {
          const dist = Math.sqrt(Math.pow(edge.x - pos.x, 2) + Math.pow(edge.y - pos.y, 2));
          if (dist < minDist) {
            minDist = dist;
            nearest = { ...edge, shapeId: id };
          }
        });
      });
      return nearest;
    };

    if (connectingStart && activeConnector) {
      const pos = getRelativePointerPos();
      if (pos) {
        const snap = findNearestSnapPoint(pos);
        
        // Haptic pulse effect when snapping
        if (snap && snap.shapeId !== activeConnector.toShapeId) {
            // Visualize snap point pulse (imaginary haptic)
            spawnReactionBurst('✨', snap.x, snap.y);
        }

        setActiveConnector(prev => ({ 
          ...prev, 
          to: snap ? { x: snap.x, y: snap.y } : pos,
          toShapeId: snap ? snap.shapeId : null
        }));
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
    } else if (tool === 'dimension') {
      const start = drawStartRef.current;
      setCurrentShape(prev => ({
        ...prev,
        points: [start.x, start.y, pos.x, pos.y],
      }));
    } else if (tool === 'chart' || tool === 'iframe' || tool === 'frame' || tool === 'video' || tool === 'gantt') {
      const start = drawStartRef.current;
      setCurrentShape(prev => ({
        ...prev,
        x: Math.min(start.x, pos.x),
        y: Math.min(start.y, pos.y),
        width: Math.abs(pos.x - start.x),
        height: Math.abs(pos.y - start.y),
      }));
    }
  }, [isDrawing, isPanning, currentShape, tool, broadcastCursor, getRelativePointerPos]);

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
      setTilt({ x: 0, y: 0 });
      return;
    }

    if (connectingStart) {
      if (activeConnector && activeConnector.toShapeId && activeConnector.toShapeId !== connectingStart.shapeId) {
        addConnector({
          fromShapeId: connectingStart.shapeId,
          toShapeId: activeConnector.toShapeId,
          color,
          routingType: isOrthogonalMode ? 'orthogonal' : 'bezier'
        });
        setTimeout(() => recalculateForShape(activeConnector.toShapeId, shapes), 50);
        setTool('select');
      }
      setConnectingStart(null);
      setActiveConnector(null);
      return;
    }

    if (!isDrawing || !currentShape) {
      setIsDrawing(false);
      return;
    }

    const ydoc = ydocRef.current;
    const yShapes = yShapesRef.current;
    if (ydoc && yShapes) {
      let shapeToSave = { ...currentShape };
      const id = 'shape-' + Date.now();

      // Ensure a minimum size for widgets if they were just clicked
      if (shapeToSave && shapeToSave.width < 10 && shapeToSave.height < 10) {
        if (['chart', 'iframe', 'video', 'gantt', 'kanban', 'qr_code'].includes(shapeToSave.type)) {
          shapeToSave.width = 600;
          shapeToSave.height = 400;
          // Center it
          shapeToSave.x -= 300;
          shapeToSave.y -= 200;
        }
      }

      // AUTO-SHAPE CONVERSION 
      if (currentShape.type === 'line' && currentShape.points.length > 10) {
        const pts = currentShape.points;
        
        if (autoShapeEnabled) {
          const recognized = recognize(pts);
          if (recognized) {
            spawnReactionBurst('✨', recognized.x, recognized.y);
            if (recognized.type === 'circle') {
              shapeToSave = {
                type: 'circle',
                x: recognized.x,
                y: recognized.y,
                radiusX: recognized.radius,
                radiusY: recognized.radius,
                color: currentShape.color,
                strokeWidth: currentShape.strokeWidth
              };
            } else if (recognized.type === 'rect') {
              shapeToSave = {
                type: 'rect',
                x: recognized.x,
                y: recognized.y,
                width: recognized.width,
                height: recognized.height,
                color: currentShape.color,
                strokeWidth: currentShape.strokeWidth
              };
            }
          }
        }
        
        if (!shapeToSave) {
          // Fallback to original primitive logic if recognize fails or is disabled
          let minX = pts[0], maxX = pts[0], minY = pts[1], maxY = pts[1];
          for (let i = 0; i < pts.length; i += 2) {
            minX = Math.min(minX, pts[i]);
            maxX = Math.max(maxX, pts[i]);
            minY = Math.min(minY, pts[i + 1]);
            maxY = Math.max(maxY, pts[i + 1]);
          }
          const w = maxX - minX;
          const h = maxY - minY;
          const distToStart = Math.sqrt(Math.pow(pts[0] - pts[pts.length - 2], 2) + Math.pow(pts[1] - pts[pts.length - 1], 2));

          if (distToStart < 60 && w > 30 && h > 30) {
            const aspectRatio = Math.max(w, h) / Math.min(w, h);
            spawnReactionBurst('✨', minX + w/2, minY + h/2);
            if (aspectRatio < 1.25) {
              shapeToSave = {
                type: 'circle',
                x: minX + w / 2,
                y: minY + h / 2,
                radiusX: w / 2,
                radiusY: h / 2,
                color: currentShape.color,
                strokeWidth: currentShape.strokeWidth
              };
            } else {
              shapeToSave = {
                type: 'rect',
                x: minX,
                y: minY,
                width: w,
                height: h,
                color: currentShape.color,
                strokeWidth: currentShape.strokeWidth
              };
            }
          }
        }
      }

      ydoc.transact(() => {
        yShapes.set(id, { ...shapeToSave, id });
      }, 'local');
    }
    
    // Physics Momentum on Drag End
    if (tool === 'select' && selectedId && !isDrawing) {
        const node = stageRef.current.findOne('#' + selectedId);
        if (node) {
            // Calculate velocity from the difference between current position and the position recorded in the last frame
            const vx = node.x() - (node._lastX || node.x());
            const vy = node.y() - (node._lastY || node.y());
            
            if (Math.abs(vx) > 0.5 || Math.abs(vy) > 0.5) {
                setMomentumShapes(prev => ({
                    ...prev,
                    [selectedId]: { vx: vx * 0.9, vy: vy * 0.9 }
                }));
            }
        }
    }


    setIsDrawing(false);
    setCurrentShape(null);
  }, [isDrawing, isPanning, currentShape, tool, selectedId, shapes, autoShapeEnabled, recognize]);

  // Momentum Loop
  useEffect(() => {
    let frameId;
    const update = () => {
        setMomentumShapes(prev => {
            const next = {};
            let hasMomentum = false;
            Object.entries(prev).forEach(([id, vel]) => {
                const shape = shapes[id];
                if (shape && (Math.abs(vel.vx) > 0.1 || Math.abs(vel.vy) > 0.1)) {
                    hasMomentum = true;
                    const nextVx = vel.vx * 0.95; // Friction
                    const nextVy = vel.vy * 0.95;
                    
                    const newX = shape.x + vel.vx;
                    const newY = shape.y + vel.vy;

                    // Update Yjs
                    const yShapes = yShapesRef.current;
                    if (yShapes && yShapes.has(id)) {
                        yShapes.set(id, { ...shape, x: newX, y: newY });
                    }
                    next[id] = { vx: nextVx, vy: nextVy };
                }
            });
            return hasMomentum ? next : {};
        });
        frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [shapes]);


  const handleTidyUp = useCallback((type) => {
    const allShapes = Object.values(shapes).filter(s => s.type !== 'line');
    const updates = calculateLayoutUpdates(allShapes, type, 100, 100);
    activeDoc.transact(() => {
        updates.forEach(u => {
            const prev = yShapesRef.current.get(u.id);
            if (prev) yShapesRef.current.set(u.id, { ...prev, x: u.x, y: u.y });
        });
    }, 'local');
    spawnReactionBurst('🪄', window.innerWidth/2, window.innerHeight/2);
  }, [shapes, activeDoc]);

  const handleCommand = useCallback((cmd) => {
    switch (cmd.action) {
      case 'setTool':
        setTool(cmd.value);
        break;
      case 'undo':
        undoManagerRef.current?.undo();
        break;
      case 'redo':
        undoManagerRef.current?.redo();
        break;
      case 'clear':
        handleClear();
        break;
      case 'export':
        handleExport();
        break;
      case 'copyLink':
        handleCopyLink();
        break;
      case 'togglePanel':
        switch (cmd.value) {
          case 'ai': setIsAIOpen(!isAIOpen); break;
          case 'templates': setIsTemplatesOpen(!isTemplatesOpen); break;
          case 'scenes': setIsScenesOpen(!isScenesOpen); break;
          case 'layers': setIsLayersOpen(!isLayersOpen); break;
          case 'timer': setIsTimerOpen(!isTimerOpen); break;
          case 'analytics': setIsAnalyticsOpen(!isAnalyticsOpen); break;
          case 'share': setIsShareOpen(!isShareOpen); break;
          case 'call': setIsCallOpen(!isCallOpen); break;
          case 'code': setIsCodeExportOpen(!isCodeExportOpen); break;
          case 'brandkit': setIsBrandKitOpen(!isBrandKitOpen); break;
          case 'soundboard': setIsSoundboardOpen(!isSoundboardOpen); break;
          case 'chat': setIsChatSidebarOpen(!isChatSidebarOpen); break;
        }
        break;
      case 'toggleReactionWheel':
        if (!reactionWheelPos) {
            setReactionWheelPos({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        } else {
            setReactionWheelPos(null);
        }
        break;
      case 'toggle':
        switch (cmd.value) {
          case '3d': setIs3DEnabled(!is3DEnabled); break;
          case 'physics': setIsPhysicsEnabled(!isPhysicsEnabled); break;
          case 'heatmap': setIsHeatmapEnabled(!isHeatmapEnabled); break;
          case 'sketch': setIsSketchMode(!isSketchMode); break;
          case 'sandbox': setIsSandboxMode(!isSandboxMode); break;
          case 'grid': setIsGridEnabled(!isGridEnabled); break;
        }
        break;
      case 'addCodeWidget': {
        const id = 'code-' + Date.now();
        const pos = {
          x: (window.innerWidth / 2 - stagePos.x) / stageScale - 200,
          y: (window.innerHeight / 2 - stagePos.y) / stageScale - 150
        };
        yShapesRef.current.doc.transact(() => {
          const map = new Y.Map();
          map.set('id', id);
          map.set('type', 'code_widget');
          map.set('x', pos.x);
          map.set('y', pos.y);
          map.set('width', 400);
          map.set('height', 300);
          map.set('language', 'javascript');
          
          // Use Y.Text for collaborative code editing!
          const yText = new Y.Text();
          yText.insert(0, '// Happy coding!');
          map.set('code', yText);
          
          yShapesRef.current.set(id, map);
        }, 'local');
        setSelectedId(id);
        break;
      }
      case 'addQRCode': {
        const id = 'qr-' + Date.now();
        const pos = {
          x: (window.innerWidth / 2 - stagePos.x) / stageScale - 100,
          y: (window.innerHeight / 2 - stagePos.y) / stageScale - 125
        };
        yShapesRef.current.doc.transact(() => {
          yShapesRef.current.set(id, {
            id,
            type: 'qr_code',
            x: pos.x,
            y: pos.y,
            width: 200,
            height: 250,
            url: window.location.href,
            visible: true
          });
        }, 'local');
        setSelectedId(id);
        break;
      }
      case 'addMindMap': {
        const id = 'mindmap-' + Date.now();
        const pos = {
          x: (window.innerWidth / 2 - stagePos.x) / stageScale - 300,
          y: (window.innerHeight / 2 - stagePos.y) / stageScale - 250
        };
        yShapesRef.current.doc.transact(() => {
          yShapesRef.current.set(id, {
            id,
            type: 'mindmap_widget',
            x: pos.x,
            y: pos.y,
            width: 600,
            height: 500
          });
        }, 'local');
        setSelectedId(id);
        break;
      }
      case 'addFlashcards': {
        const id = 'flash-' + Date.now();
        const pos = {
          x: (window.innerWidth / 2 - stagePos.x) / stageScale - 200,
          y: (window.innerHeight / 2 - stagePos.y) / stageScale - 250
        };
        yShapesRef.current.doc.transact(() => {
          yShapesRef.current.set(id, {
            id,
            type: 'flashcard_widget',
            x: pos.x,
            y: pos.y,
            width: 400,
            height: 500
          });
        }, 'local');
        setSelectedId(id);
        break;
      }
      case 'addCalculator': {
        const id = 'calc-' + Date.now();
        const pos = {
          x: (window.innerWidth / 2 - stagePos.x) / stageScale - 125,
          y: (window.innerHeight / 2 - stagePos.y) / stageScale - 200
        };
        yShapesRef.current.doc.transact(() => {
          yShapesRef.current.set(id, {
            id,
            type: 'calculator_widget',
            x: pos.x,
            y: pos.y,
            width: 250,
            height: 400
          });
        }, 'local');
        setSelectedId(id);
        break;
      }
      case 'layout': {
        const allShapes = Object.values(shapes).filter(s => s.type !== 'line');
        const updates = calculateLayoutUpdates(allShapes, cmd.value, 400, 400);
        activeDoc.transact(() => {
          updates.forEach(u => {
            const prev = yShapesRef.current.get(u.id);
            if (prev) {
                yShapesRef.current.set(u.id, { ...prev, x: u.x, y: u.y });
                recalculateForShape(u.id, shapes);
            }
          });
        }, 'local');
        break;
      }
    }
  }, [
    handleClear, handleExport, handleCopyLink,
    isAIOpen, isTemplatesOpen, isScenesOpen, isLayersOpen, isTimerOpen, isAnalyticsOpen, isShareOpen, isCallOpen, isCodeExportOpen, isBrandKitOpen, isSoundboardOpen,
    is3DEnabled, isPhysicsEnabled, isHeatmapEnabled, isSketchMode, isSandboxMode, isGridEnabled,
    stagePos, stageScale, shapes, activeDoc, recalculateForShape
  ]);


  const handleClear = useCallback(() => {
    const ydoc = ydocRef.current;
    const yShapes = yShapesRef.current;
    const yNotes = yNotesRef.current;
    if (ydoc) {
      ydoc.transact(() => {
        if (yShapes) yShapes.clear();
        if (yNotes) yNotes.clear();
      }, 'local');
    }
  }, []);

  const handleExport = useCallback(() => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = `whiteboard-${roomId}-${Date.now()}.png`;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [roomId]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const pos = stageRef.current.getPointerPosition();
    const files = e.dataTransfer.files;

    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          const yShapes = yShapesRef.current;
          const id = 'image-' + Date.now();
          const img = new Image();
          img.onload = () => {
            const aspect = img.width / img.height;
            const w = 400;
            const h = 400 / aspect;

            yShapes.doc.transact(() => {
              yShapes.set(id, {
                id,
                type: 'image',
                src: reader.result,
                x: (pos.x - stagePos.x) / stageScale - w / 2,
                y: (pos.y - stagePos.y) / stageScale - h / 2,
                width: w,
                height: h,
                color: '#000000',
                strokeWidth: 0,
              });
            }, 'local');
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      }
    } else {
      const urlText = e.dataTransfer.getData('URL') || e.dataTransfer.getData('text/plain');
      if (urlText && (urlText.startsWith('http://') || urlText.startsWith('https://'))) {
        const yShapes = yShapesRef.current;
        if (!yShapes) return;
        const id = 'link-' + Date.now();
        yShapes.doc.transact(() => {
          yShapes.set(id, {
            id,
            type: 'rect',
            x: (pos.x - stagePos.x) / stageScale - 100,
            y: (pos.y - stagePos.y) / stageScale - 30,
            width: 200,
            height: 60,
            color: '#34d399',
            strokeWidth: 3,
            label: urlText.length > 30 ? urlText.substring(0, 27) + '...' : urlText
          });
        }, 'local');
      }
    }
  }, [stagePos, stageScale]);

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

  const propagateMasterChanges = useCallback((masterId, masterShape) => {
    const yShapes = yShapesRef.current;
    if (!yShapes) return;
    
    const { x, y, rotation, id, isMaster, ...syncProps } = masterShape;
    
    yShapes.forEach((shape, shapeId) => {
      if (shape.masterId === masterId && !shape.isMaster) {
        yShapes.set(shapeId, { ...shape, ...syncProps });
      }
    });
  }, []);

  const handleMakeMaster = useCallback(() => {
    if (!selectedId) return;
    const yShapes = yShapesRef.current;
    if (!yShapes) return;
    const shape = yShapes.get(selectedId);
    if (!shape) return;

    yShapes.doc.transact(() => {
      yShapes.set(selectedId, { ...shape, isMaster: true, masterId: selectedId });
    }, 'local');
  }, [selectedId]);

  const handleDuplicate = useCallback(() => {
    if (!selectedId) return;
    const yShapes = yShapesRef.current;
    if (!yShapes) return;
    const shape = yShapes.get(selectedId);
    if (!shape) return;

    const id = 'shape-' + Date.now();
    const newShape = {
        ...shape,
        id,
        x: shape.x + 20,
        y: shape.y + 20,
        isMaster: false,
    };

    yShapes.doc.transact(() => {
      yShapes.set(id, newShape);
    }, 'local');
    setSelectedId(id);
  }, [selectedId, shapes]);

  const handleShapeDragEnd = useCallback((id, e) => {
    const yShapes = yShapesRef.current;
    if (!yShapes) return;
    const prev = yShapes.get(id);
    if (!prev) return;

    yShapes.doc.transact(() => {
      yShapes.set(id, { ...prev, x: e.target.x(), y: e.target.y() });
    }, 'local');
    
    // Cleanup internal tracking
    delete e.target._lastX;
    delete e.target._lastY;

    recalculateForShape(id, shapes);
  }, [shapes, recalculateForShape]);

  const handleShapeDragMove = useCallback((id, e) => {
      const node = e.target;
      // Track position for momentum calculation
      node._lastX = node._lastX_prev || node.x();
      node._lastY = node._lastY_prev || node.y();
      node._lastX_prev = node.x();
      node._lastY_prev = node.y();
  }, []);


  const handleShapeTransformEnd = useCallback((id, e) => {
    const node = e.target;
    const yShapes = yShapesRef.current;
    if (!yShapes) return;
    const prev = yShapes.get(id);
    if (!prev) return;
    yShapes.doc.transact(() => {
      const newShape = {
        ...prev,
        x: node.x(),
        y: node.y(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
        rotation: node.rotation(),
      };
      yShapes.set(id, newShape);
      if (newShape.isMaster) {
        propagateMasterChanges(newShape.masterId, newShape);
      }
    }, 'local');
  }, [propagateMasterChanges]);

  const handleDblClick = useCallback((id, shape) => {
    if (tool !== 'select') return;
    setEditingLabelId(id);
    setEditingLabelText(shape.label || '');
  }, [tool]);

  const handleSaveLabel = useCallback(() => {
    if (!editingLabelId) return;
    const yShapes = yShapesRef.current;
    if (!yShapes) return;
    
    const prev = yShapes.get(editingLabelId);
    if (prev) {
      yShapes.doc.transact(() => {
        yShapes.set(editingLabelId, { ...prev, label: editingLabelText });
      }, 'local');
    }
    setEditingLabelId(null);
    setEditingLabelText('');
  }, [editingLabelId, editingLabelText]);



  const renderEdgeDots = (shape) => {
    if (tool !== 'connector' && selectedId !== shape.id) return null;
    const pts = getShapeEdgePoints(shape);
    return pts.map((pt, idx) => (
      <Circle
        key={`dot-${shape.id}-${idx}`}
        x={pt.x}
        y={pt.y}
        radius={6}
        fill="#6366f1"
        stroke="#ffffff"
        strokeWidth={2}
        listening={tool === 'connector'}
        onPointerDown={(e) => {
          e.cancelBubble = true;
          setConnectingStart({ shapeId: shape.id, point: pt });
          setActiveConnector({ from: pt, to: pt });
        }}
        onPointerEnter={(e) => {
           if (tool === 'connector') {
               e.target.getStage().container().style.cursor = 'crosshair';
               e.target.scale({ x: 1.5, y: 1.5 });
           }
        }}
        onPointerLeave={(e) => {
           if (tool === 'connector') {
               e.target.getStage().container().style.cursor = 'default';
               e.target.scale({ x: 1, y: 1 });
           }
        }}
        onPointerUp={(e) => {
           if (connectingStart && connectingStart.shapeId !== shape.id) {
               e.cancelBubble = true;
               addConnector({
                   fromShapeId: connectingStart.shapeId,
                   toShapeId: shape.id,
                   color,
                   routingType: isOrthogonalMode ? 'orthogonal' : 'bezier'
               });
               // Force recalculation for the newly added connector
               setTimeout(() => recalculateForShape(shape.id, shapes), 50);
               setConnectingStart(null);
               setActiveConnector(null);
               setTool('select');
           }
        }}
      />
    ));
  };

  const renderedShapes = useMemo(() => {
    return Object.entries(shapes)
      .sort(([, a], [, b]) => (a.zIndex || 0) - (b.zIndex || 0))
      .map(([id, shape]) => {
        if (shape.visible === false) return null;
      if (!shape) return null;
      const isSelected = selectedId === id;
      const commonProps = {
        id: id,
        x: shape.x || 0,
        y: shape.y || 0,
        rotation: shape.rotation || 0,
        scaleX: shape.scaleX || 1,
        scaleY: shape.scaleY || 1,
        stroke: shape.color,
        strokeWidth: shape.strokeWidth,
        draggable: tool === 'select' && !shape.locked,
        listening: !shape.locked || tool === 'select',
        onClick: () => tool === 'select' && !shape.locked && setSelectedId(id),
        onTap: () => tool === 'select' && !shape.locked && setSelectedId(id),
        onDragMove: (e) => !shape.locked && handleShapeDragMove(id, e),
        onDragEnd: (e) => !shape.locked && handleShapeDragEnd(id, e),
        onTransformEnd: (e) => !shape.locked && handleShapeTransformEnd(id, e),
        onDblClick: () => !shape.locked && handleDblClick(id, shape),
      };


      switch (shape.type) {
        case 'line':
          return (
            <Line
              key={id}
              {...commonProps}
              points={shape.points}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            />
          );
        case 'rect': {
          if (isSketchMode) {
            const w = shape.width * (shape.scaleX || 1);
            const h = shape.height * (shape.scaleY || 1);
            // Draw a rectangle as 4 lines with slight overlap and jitter
            const jitter = 3;
            const pts = [
                0 + Math.random()*jitter-jitter/2, 0 + Math.random()*jitter-jitter/2,
                w + Math.random()*jitter-jitter/2, 0 + Math.random()*jitter-jitter/2,
                w + Math.random()*jitter-jitter/2, h + Math.random()*jitter-jitter/2,
                0 + Math.random()*jitter-jitter/2, h + Math.random()*jitter-jitter/2,
                0 + Math.random()*jitter-jitter/2, 0 + Math.random()*jitter-jitter/2
            ];
            return (
              <Group key={id}>
                <Line 
                    {...commonProps}
                    x={shape.x} y={shape.y}
                    scaleX={1} scaleY={1}
                    points={pts}
                    tension={0.1}
                    lineCap="round"
                    lineJoin="round"
                />
                {renderEdgeDots(shape)}
              </Group>
            );
          }
          return (
            <Group key={id}>
              <Rect
                {...commonProps}
                width={shape.width}
                height={shape.height}
              />
              {renderEdgeDots(shape)}
              {shape.label && (
                <Text
                  x={shape.x + (shape.width * (shape.scaleX || 1)) / 2}
                  y={shape.y + (shape.height * (shape.scaleY || 1)) / 2}
                  text={shape.label}
                  fontSize={14}
                  fill="#333333"
                  align="center"
                  verticalAlign="middle"
                  width={shape.width * (shape.scaleX || 1)}
                  height={shape.height * (shape.scaleY || 1)}
                  offsetX={(shape.width * (shape.scaleX || 1)) / 2}
                  offsetY={(shape.height * (shape.scaleY || 1)) / 2}
                  listening={false}
                />
              )}
            </Group>
          );
        }
        case 'circle': {
          if (isSketchMode) {
            const rx = shape.radiusX * (shape.scaleX || 1);
            const ry = shape.radiusY * (shape.scaleY || 1);
            const pts = [];
            const steps = 16;
            const jitter = 2.5;
            for (let i = 0; i <= steps; i++) {
                const angle = (i / steps) * Math.PI * 2;
                pts.push(
                    Math.cos(angle) * rx + Math.random()*jitter-jitter/2,
                    Math.sin(angle) * ry + Math.random()*jitter-jitter/2
                );
            }
            return (
              <Group key={id}>
                <Line 
                    {...commonProps}
                    scaleX={1} scaleY={1}
                    points={pts}
                    tension={0.5}
                    lineCap="round"
                    closed={true}
                />
                {renderEdgeDots(shape)}
              </Group>
            );
          }
          return (
            <Group key={id}>
              <Ellipse
                {...commonProps}
                radiusX={shape.radiusX}
                radiusY={shape.radiusY}
              />
              {renderEdgeDots(shape)}
              {shape.label && (
                <Text
                  x={shape.x}
                  y={shape.y}
                  text={shape.label}
                  fontSize={14}
                  fill="#333333"
                  align="center"
                  verticalAlign="middle"
                  width={shape.radiusX * 2 * (shape.scaleX || 1)}
                  height={shape.radiusY * 2 * (shape.scaleY || 1)}
                  offsetX={shape.radiusX * (shape.scaleX || 1)}
                  offsetY={shape.radiusY * (shape.scaleY || 1)}
                  listening={false}
                />
              )}
            </Group>
          );
        }
        case 'image':
          return (
            <CanvasImage
              key={id}
              {...commonProps}
              shape={shape}
              draggable={tool === 'select'}
            />
          );
        case 'text':
          return (
            <Text
              key={id}
              {...commonProps}
              text={shape.text}
              fontSize={shape.fontSize || 16}
              fill={shape.color || '#000000'}
              fontFamily={shape.fontFamily || 'Inter, sans-serif'}
              fontStyle={shape.fontStyle || 'normal'}
              strokeWidth={0} // Text should use fill for color, not stroke
            />
          );
        case 'dimension':
          return (
            <DimensionLine
              key={id}
              {...commonProps}
              points={shape.points}
              scaleFactor={1}
              unit="cm"
            />
          );
        case 'chart':
          return (
            <Group key={id} {...commonProps}>
              <Html divProps={{ style: { width: shape.width, height: shape.height } }}>
                <ChartWidget shapeId={id} ydoc={activeDoc} initialData={shape.chartData ? JSON.parse(shape.chartData) : null} />
              </Html>
            </Group>
          );
        case 'iframe':
          return (
            <Group key={id} {...commonProps}>
              <Html divProps={{ style: { width: shape.width, height: shape.height } }}>
                <IframeWidget shapeId={id} ydoc={activeDoc} initialUrl={shape.url} />
              </Html>
            </Group>
          );
        case 'kanban':
          return (
            <Group key={id} {...commonProps}>
              <Html divProps={{ style: { width: shape.width, height: shape.height } }}>
                <KanbanBoard shapeId={id} ydoc={activeDoc} />
              </Html>
            </Group>
          );
        case 'video_widget':
          return (
            <Group key={id} {...commonProps}>
              <Html divProps={{ style: { width: shape.width, height: shape.height } }}>
                <VideoWidget shapeId={id} ydoc={activeDoc} initialUrl={shape.url} />
              </Html>
            </Group>
          );
        case 'code_widget':
          return (
            <CodeWidget 
              key={id}
              id={id}
              shapeMap={shape._raw || yShapesRef.current.get(id)}
              onDelete={(shapeId) => {
                  activeDoc.transact(() => {
                      yShapesRef.current.delete(shapeId);
                  }, 'local');
              }}
            />
          );
        case 'frame':
          return (
            <FrameShape
              key={id}
              shape={shape}
              isSelected={id === selectedId}
              onSelect={() => setSelectedId(id)}
              draggable={tool === 'select'}
            />
          );
        case 'portal':
          return (
            <PortalShape
              key={id}
              shape={shape}
              isSelected={id === selectedId}
              onNavigate={handleTransitionTo}
              draggable={tool === 'select' && !shape.locked}
            />
          );
        case 'qr_code':
          return (
            <Group key={id} {...commonProps}>
              <Html divProps={{ style: { width: shape.width, height: shape.height } }}>
                <QRCodeWidget shapeId={id} ydoc={activeDoc} initialUrl={shape.url} />
              </Html>
            </Group>
          );
        case 'gantt':
          return (
            <Group key={id} {...commonProps}>
              <Html divProps={{ style: { width: shape.width, height: shape.height } }}>
                <GanttChartWidget shapeId={id} ydoc={activeDoc} />
              </Html>
            </Group>
          );
        case 'mindmap_widget':
          return (
            <Group key={id} {...commonProps}>
              <Html divProps={{ style: { width: shape.width, height: shape.height } }}>
                <MindMapWidget shapeId={id} ydoc={activeDoc} />
              </Html>
            </Group>
          );
        case 'flashcard_widget':
          return (
            <Group key={id} {...commonProps}>
              <Html divProps={{ style: { width: shape.width, height: shape.height } }}>
                <FlashcardWidget shapeId={id} ydoc={activeDoc} />
              </Html>
            </Group>
          );
        case 'calculator_widget':
          return (
            <Group key={id} {...commonProps}>
              <Html divProps={{ style: { width: shape.width, height: shape.height } }}>
                <CalculatorWidget shapeId={id} ydoc={activeDoc} />
              </Html>
            </Group>
          );
        default: return null;
      }
    });
  }, [shapes, tool, selectedId, handleShapeDragEnd, activeDoc, currentUser, stackUsers]);

  const handlePhysicsUpdate = useCallback((data) => {
    const yShapes = yShapesRef.current;
    const yNotes = yNotesRef.current;
    if (!yShapes || !yNotes) return;

    // Throttle sync to avoid Yjs overhead
    const now = Date.now();
    if (now - lastPhysicsSyncRef.current < 33) return; // ~30fps sync
    lastPhysicsSyncRef.current = now;

    yShapes.doc.transact(() => {
      data.items.forEach(item => {
        if (item.type === 'shape') {
          const existing = yShapes.get(item.id);
          if (existing) {
            yShapes.set(item.id, { 
                ...existing, 
                x: item.x, 
                y: item.y, 
                rotation: (item.angle * 180) / Math.PI,
                velocity: item.velocity,
                angularVelocity: item.angularVelocity
            });
          }
        } else if (item.type === 'note') {
          const noteMap = yNotes.get(item.id);
          if (noteMap) {
            noteMap.set('x', item.x);
            noteMap.set('y', item.y);
            noteMap.set('rotation', (item.angle * 180) / Math.PI);
            noteMap.set('velocity', item.velocity);
          }
        }
      });
    }, 'local');
  }, []);

  const zoomPercent = Math.round(stageScale * 100);

  return (
    <div className={`canvas-container relative w-full h-full overflow-hidden transition-colors duration-1000 ${isBrainstormingMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <DynamicBackground ydoc={activeDoc} />
      
      <ChatSidebar 
        ydoc={activeDoc}
        currentUser={currentUser}
        isOpen={isChatSidebarOpen}
        onClose={() => setIsChatSidebarOpen(false)}
      />
      
      <div 
        className={`relative w-full h-full ${spaceHeld || isPanning ? 'panning' : ''} animate-fade-in`}
        style={{
          backgroundPosition: `${stagePos.x}px ${stagePos.y}px`,
          backgroundSize: `${20 * stageScale}px ${20 * stageScale}px, ${20 * stageScale}px ${20 * stageScale}px, ${100 * stageScale}px ${100 * stageScale}px, ${100 * stageScale}px ${100 * stageScale}px`,
          backgroundImage: isBrainstormingMode 
            ? `radial-gradient(circle, rgba(99, 102, 241, 0.15) 1px, transparent 1px), radial-gradient(circle, rgba(99, 102, 241, 0.05) 1px, transparent 1px)`
            : undefined,
          transform: is3DEnabled ? `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` : 'none',
          transition: isPanning ? 'none' : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), background-color 1s ease'
        }}
      >
      {currentUser.isGuest && <GuestBanner />}
      
      <AnimatePresence>
        {isAIOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-6 right-6 z-[1001]"
          >
            <AISidebar 
              isOpen={isAIOpen}
              onClose={() => setIsAIOpen(false)}
              ydoc={activeDoc}
              viewportCenter={{ 
                x: (-stagePos.x + window.innerWidth / 2) / stageScale,
                y: (-stagePos.y + window.innerHeight / 2) / stageScale 
              }}
              stageScale={stageScale}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBrandKitOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-6 right-6 z-[1001]"
          >
            <BrandKitSidebar 
              isOpen={isBrandKitOpen}
              onClose={() => setIsBrandKitOpen(false)}
              ydoc={activeDoc}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isScenesOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 pointer-events-none z-[1002] flex items-center justify-center"
          >
            <div className="pointer-events-auto">
              <ScenePanel
                isOpen={isScenesOpen}
                onClose={() => setIsScenesOpen(false)}
                ydoc={activeDoc}
                stagePos={stagePos}
                stageScale={stageScale}
                onTransitionTo={handleTransitionTo}
                shapes={shapes}
                followUserId={followUserId}
                remoteCursors={remoteCursors}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBrainstormingMode && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[1003] pointer-events-none"
          >
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-2 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-auto">
                <div className="flex items-center gap-2 px-3 border-r border-slate-700 mr-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brainstorming</span>
                </div>
                <button 
                    onClick={() => handleCommand({ action: 'addMindMap' })}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-500/20"
                >
                    <Network size={14} /> New Mind Map
                </button>
                <button 
                    onClick={() => handleCommand({ action: 'setTool', value: 'note' })}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-700"
                >
                    <StickyNote size={14} /> Sticky Notes
                </button>
                <button 
                    onClick={() => setIsBrainstormingMode(false)}
                    className="p-2 text-slate-500 hover:text-slate-300 transition"
                >
                    <X size={16} />
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isLayersOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed top-20 left-6 z-[1001]"
          >
            <LayersPanel 
              isOpen={isLayersOpen}
              onClose={() => setIsLayersOpen(false)}
              shapes={shapes}
              stickyNotes={stickyNotes}
              selectedId={selectedId}
              onSelect={setSelectedId}
              ydoc={activeDoc}
            />
          </motion.div>
        )}
      </AnimatePresence>


      <TemplatesModal 
        isOpen={isTemplatesOpen} 
        onClose={() => setIsTemplatesOpen(false)}
        yShapes={yShapesRef.current}
        viewportCenter={{ 
          x: (-stagePos.x + window.innerWidth / 2) / stageScale,
          y: (-stagePos.y + window.innerHeight / 2) / stageScale 
        }}
      />
      {/* ====== TOOLBAR ====== */}
      <div className="toolbar animate-slide-up">
        <div className="toolbar-section">
          <span className="toolbar-label">Tools</span>
          <button className={`tool-btn ${tool === 'pen' ? 'active' : ''}`} onClick={() => { setTool('pen'); setActiveEmoji(null); }} title="Pen">
            <Pencil size={18} />
          </button>
          <button className={`tool-btn ${tool === 'select' ? 'active' : ''}`} onClick={() => { setTool('select'); setActiveEmoji(null); }} title="Selection">
            <MousePointer2 size={18} />
          </button>
          <button className={`tool-btn ${tool === 'rect' ? 'active' : ''}`} onClick={() => { setTool('rect'); setActiveEmoji(null); }} title="Rectangle">
            <Square size={18} />
          </button>
          <button className={`tool-btn ${tool === 'circle' ? 'active' : ''}`} onClick={() => { setTool('circle'); setActiveEmoji(null); }} title="Circle">
            <CircleIcon size={18} />
          </button>
          <button className={`tool-btn ${tool === 'note' ? 'active' : ''}`} onClick={() => { setTool('note'); setActiveEmoji(null); }} title="Sticky Note">
            <StickyNote size={18} />
          </button>
          <button className={`tool-btn ${tool === 'frame' ? 'active' : ''}`} onClick={() => { setTool('frame'); setActiveEmoji(null); }} title="Frame / Slide">
            <LayoutTemplate size={18} />
          </button>
          <button 
            className={`tool-btn ${isOrthogonalMode ? 'active' : ''}`}
            onClick={() => setIsOrthogonalMode(!isOrthogonalMode)} 
            title="Toggle Orthogonal Connectors"
          >
            <GitCommit size={18} className={isOrthogonalMode ? "text-indigo-400 rotate-90" : ""} />
          </button>
          <button className={`tool-btn ${tool === 'dimension' ? 'active' : ''}`} onClick={() => { setTool('dimension'); setActiveEmoji(null); }} title="Dimension Tool">
            <Ruler size={18} />
          </button>
          <button className={`tool-btn ${tool === 'chart' ? 'active' : ''}`} onClick={() => { setTool('chart'); setActiveEmoji(null); }} title="Interactive Chart">
            <PollIcon size={18} />
          </button>
          <button className={`tool-btn ${tool === 'gantt' ? 'active' : ''}`} onClick={() => { setTool('gantt'); setActiveEmoji(null); }} title="Gantt Chart">
            <Calendar size={18} />
          </button>
          <button className={`tool-btn ${tool === 'kanban' ? 'active' : ''}`} onClick={() => { setTool('kanban'); setActiveEmoji(null); }} title="Kanban Board">
            <LayoutGrid size={18} />
          </button>
          <button className={`tool-btn ${tool === 'iframe' ? 'active' : ''}`} onClick={() => { setTool('iframe'); setActiveEmoji(null); }} title="Web Portal">
            <Globe size={18} />
          </button>
          <button className={`tool-btn ${tool === 'video' ? 'active' : ''}`} onClick={() => { setTool('video'); setActiveEmoji(null); }} title="Video Player">
            <VideoIcon size={18} />
          </button>
          <button className={`tool-btn ${tool === 'portal' ? 'active' : ''}`} onClick={() => { setTool('portal'); setActiveEmoji(null); }} title="Navigation Portal">
            <Compass size={18} />
          </button>
          <button className={`tool-btn ${tool === 'qr' ? 'active' : ''}`} onClick={() => { setTool('qr'); setActiveEmoji(null); }} title="QR Code Generator">
            <QrCode size={18} />
          </button>
          <button className="tool-btn" onClick={() => handleTidyUp(LAYOUT_TYPES.GRID)} title="Tidy Up (Grid)">
            <Grid3X3 size={18} className="text-blue-500" />
          </button>
          <div className="toolbar-divider" />
          <button 
            className={`tool-btn ${isGridEnabled ? 'active' : ''}`} 
            onClick={() => setIsGridEnabled(!isGridEnabled)} 
            title="Toggle Grid Snapping"
          >
            <Grid3X3 size={18} className={isGridEnabled ? "text-indigo-400" : ""} />
          </button>
          <button 
            className={`tool-btn ${is3DEnabled ? 'active' : ''}`} 
            onClick={() => setIs3DEnabled(!is3DEnabled)} 
            title="Toggle 3D View"
          >
            <Box size={18} className={is3DEnabled ? "text-indigo-400" : ""} />
          </button>
          <button 
            className={`tool-btn ${isPhysicsEnabled ? 'active' : ''}`}
            onClick={() => setIsPhysicsEnabled(!isPhysicsEnabled)}
            title="Toggle Physics Engine"
          >
            <Zap size={18} className={isPhysicsEnabled ? 'text-yellow-400' : ''} />
          </button>
          <button 
            className={`tool-btn ${isHeatmapEnabled ? 'active' : ''}`}
            onClick={() => setIsHeatmapEnabled(!isHeatmapEnabled)}
            title="Toggle Activity Heatmap"
          >
            <Sparkles size={18} className={isHeatmapEnabled ? 'text-orange-400' : ''} />
          </button>
          <button 
            className={`tool-btn ${isLayersOpen ? 'active' : ''}`} 
            onClick={() => setIsLayersOpen(!isLayersOpen)} 
            title="Toggle Layers Panel"
          >
            <Layers size={18} className={isLayersOpen ? "text-indigo-400" : ""} />
          </button>
          <button 
            className={`tool-btn ${isSketchMode ? 'active' : ''}`} 
            onClick={() => setIsSketchMode(!isSketchMode)} 
            title="Toggle Sketch Mode"
          >
            <Highlighter size={18} className={isSketchMode ? "text-yellow-400" : ""} />
          </button>
          <button 
            className={`tool-btn ${isSandboxMode ? 'active' : ''}`} 
            onClick={() => setIsSandboxMode(!isSandboxMode)} 
            title="Toggle Sandbox Mode (Physics Playground)"
          >
            <Gamepad2 size={18} className={isSandboxMode ? "text-red-400 animate-bounce" : ""} />
          </button>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-section">
          <span className="toolbar-label">Color</span>
          <div className="color-picker-wrapper">
            <div className="color-picker-swatch" style={{ background: color }} />
            <input type="color" className="color-picker-input" value={color} onChange={(e) => {
              const newColor = e.target.value;
              setColor(newColor);
              if (selectedId) {
                const yShapes = yShapesRef.current;
                const shape = yShapes.get(selectedId);
                if (shape) {
                  yShapes.doc.transact(() => {
                    const updated = { ...shape, color: newColor };
                    yShapes.set(selectedId, updated);
                    if (updated.isMaster) propagateMasterChanges(updated.masterId, updated);
                  }, 'local');
                }
              }
            }} />
          </div>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-section">
          <span className="toolbar-label">Size</span>
          <div className="stroke-slider-wrapper">
            <Minus size={10} color="rgba(255,255,255,0.3)" />
            <input type="range" className="stroke-slider" min={1} max={20} value={strokeWidth} onChange={(e) => {
              const val = Number(e.target.value);
              setStrokeWidth(val);
              if (selectedId) {
                const yShapes = yShapesRef.current;
                const shape = yShapes.get(selectedId);
                if (shape) {
                  yShapes.doc.transact(() => {
                    const updated = { ...shape, strokeWidth: val };
                    yShapes.set(selectedId, updated);
                    if (updated.isMaster) propagateMasterChanges(updated.masterId, updated);
                  }, 'local');
                }
              }
            }} />
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
          <span className="toolbar-label">Branding</span>
          <button 
            className={`tool-btn ${isBrandKitOpen ? 'active' : ''}`}
            onClick={() => setIsBrandKitOpen(!isBrandKitOpen)}
            title="Brand Kit"
          >
            <Palette size={18} className={isBrandKitOpen ? "text-indigo-500" : ""} />
          </button>
          <button 
            className={`tool-btn ${isThemeGeneratorOpen ? 'active' : ''}`}
            onClick={() => setIsThemeGeneratorOpen(true)}
            title="AI Theme Studio"
          >
            <Wand2 size={18} className={isThemeGeneratorOpen ? "text-indigo-500" : ""} />
          </button>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-section">
          <span className="toolbar-label">Templates</span>
          <button 
            className={`tool-btn ${isTemplatesOpen ? 'active' : ''}`}
            onClick={() => setIsTemplatesOpen(true)}
            title="Templates"
          >
            <LayoutTemplate size={18} />
          </button>
          <button 
            className={`tool-btn ${isAIOpen ? 'active' : ''}`}
            onClick={() => setIsAIOpen(!isAIOpen)}
            title="AI Design Assistant"
          >
            <Sparkles size={18} className={isAIOpen ? "text-indigo-500" : ""} />
          </button>
          <button 
            className={`tool-btn ${isScenesOpen ? 'active' : ''}`}
            onClick={() => setIsScenesOpen(!isScenesOpen)}
            title="Presentation Scenes"
          >
            <Presentation size={18} className={isScenesOpen ? "text-blue-500" : ""} />
          </button>
          <button 
            className={`tool-btn ${isBroadcastingView ? 'active' : ''}`}
            onClick={() => {
                const nextState = !isBroadcastingView;
                setIsBroadcastingView(nextState);
                providerRef.current.awareness.setLocalStateField('isPresenter', nextState);
                if (nextState) {
                    providerRef.current.awareness.setLocalStateField('viewport', { x: stagePos.x, y: stagePos.y, scale: stageScale });
                }
            }}
            title={isBroadcastingView ? "Stop Presenting" : "Present (Follow Me)"}
          >
            <div className={`w-2 h-2 rounded-full mr-1 ${isBroadcastingView ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-[10px] font-bold">LIVE</span>
          </button>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-section">
          <span className="toolbar-label">Reactions</span>
          <EmojiPicker 
            activeEmoji={activeEmoji}
            onSelectEmoji={(e) => {
               setActiveEmoji(e);
               if (e) setTool('select');
            }}
          />
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-section">
          <span className="toolbar-label">Call</span>
          <button 
            className={`tool-btn ${isCallOpen ? 'active' : ''} ${incomingCall ? 'animate-pulse ring-2 ring-green-500' : ''}`} 
            onClick={() => {
              setIsCallOpen(!isCallOpen);
              setIncomingCall(false);
            }} 
            title="Voice/Video Call"
          >
            <Phone size={18} className={isCallOpen ? "text-green-500" : ""} />
          </button>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-section">
          <span className="toolbar-label">Features</span>
          <button 
            className={`tool-btn ${isTimerOpen ? 'active' : ''}`} 
            onClick={() => setIsTimerOpen(!isTimerOpen)} 
            title="Collaborative Timer"
          >
            <Clock size={18} className={isTimerOpen ? "text-blue-500" : ""} />
          </button>
          <button 
            className={`tool-btn ${isAnalyticsOpen ? 'active' : ''}`} 
            onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)} 
            title="Board Analytics"
          >
            <PollIcon size={18} className={isAnalyticsOpen ? "text-indigo-500" : ""} />
          </button>
          <button 
            className={`tool-btn ${isAutomationOpen ? 'active' : ''}`} 
            onClick={() => setIsAutomationOpen(!isAutomationOpen)} 
            title="Workflow Automations"
          >
            <Zap size={18} className={isAutomationOpen ? "text-amber-500" : ""} />
          </button>
          <button 
            className={`tool-btn ${isAIImageOpen ? 'active' : ''}`} 
            onClick={() => setIsAIImageOpen(!isAIImageOpen)} 
            title="AI Image Studio"
          >
            <ImageIcon size={18} className={isAIImageOpen ? "text-purple-500" : ""} />
          </button>
          <button 
            className={`tool-btn ${isTicTacToeOpen ? 'active' : ''}`} 
            onClick={() => setIsTicTacToeOpen(!isTicTacToeOpen)} 
            title="Play Tic Tac Toe"
          >
            <Gamepad2 size={18} className={isTicTacToeOpen ? "text-pink-500" : ""} />
          </button>
          <button 
            className={`tool-btn ${isPollCreationOpen ? 'active' : ''}`} 
            onClick={() => setIsPollCreationOpen(!isPollCreationOpen)} 
            title="Launch Poll"
          >
            <PollIcon size={18} className={isPollCreationOpen ? "text-orange-500" : ""} />
          </button>
          <button 
            className={`tool-btn ${isAgendaOpen ? 'active' : ''}`} 
            onClick={() => setIsAgendaOpen(!isAgendaOpen)} 
            title="Meeting Agenda"
          >
            <ListTodo size={18} className={isAgendaOpen ? "text-emerald-500" : ""} />
          </button>
          <button 
            className={`tool-btn ${isSoundboardOpen ? 'active' : ''}`} 
            onClick={() => setIsSoundboardOpen(!isSoundboardOpen)} 
            title="Shared Soundboard"
          >
            <Music size={18} className={isSoundboardOpen ? "text-indigo-500" : ""} />
          </button>
          <button 
            className={`tool-btn ${isBrainstormingMode ? 'active' : ''}`} 
            onClick={() => setIsBrainstormingMode(!isBrainstormingMode)} 
            title="Brainstorming Mode"
          >
            <Network size={18} className={isBrainstormingMode ? "text-indigo-500 animate-pulse" : ""} />
          </button>
          <button 
            className={`tool-btn ${isChatSidebarOpen ? 'active' : ''}`} 
            onClick={() => setIsChatSidebarOpen(!isChatSidebarOpen)} 
            title="Toggle Team Chat"
          >
            <MessageSquare size={18} className={isChatSidebarOpen ? "text-indigo-500" : ""} />
          </button>
          <button 
            className="tool-btn" 
            onClick={() => handleCommand({ action: 'addFlashcards' })} 
            title="Add Flashcard Deck"
          >
            <BrainCircuit size={18} className="text-emerald-500" />
          </button>
          <button 
            className="tool-btn" 
            onClick={() => handleCommand({ action: 'addCalculator' })} 
            title="Add Shared Calculator"
          >
            <Calculator size={18} className="text-indigo-400" />
          </button>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-section">
          <span className="toolbar-label">Share</span>
          <button className={`tool-btn ${isShareOpen ? 'active' : ''}`} onClick={() => setIsShareOpen(true)} title="Share Settings">
            <Users size={18} className={isShareOpen ? "text-blue-500" : ""} />
          </button>
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
          <div className="toolbar-divider" />
          <button className="tool-btn" onClick={handleExport} title="Export PNG">
            <Download size={18} />
          </button>
          <button 
            className={`tool-btn ${isCodeExportOpen ? 'active' : ''}`} 
            onClick={() => setIsCodeExportOpen(!isCodeExportOpen)} 
            title="Export to React Code"
          >
            <Code size={18} className={isCodeExportOpen ? "text-blue-400" : ""} />
          </button>
          <button 
            className={`tool-btn ${isPortalOpen ? 'active' : ''}`} 
            onClick={() => setIsPortalOpen(true)} 
            title="Open 3D Portal"
          >
            <Box size={18} className={isPortalOpen ? "text-purple-400" : ""} />
          </button>
        </div>

        {selectedId && (
            <>
                <div className="toolbar-divider" />
                <div className="toolbar-section">
                    <span className="toolbar-label">Component</span>
                    <button 
                        className={`tool-btn ${shapes[selectedId]?.isMaster ? 'active' : ''}`} 
                        onClick={handleMakeMaster}
                        title="Convert to Master Component"
                    >
                        <Layers size={18} />
                    </button>
                    <button 
                        className="tool-btn"
                        onClick={handleDuplicate}
                        title="Duplicate (Alt+Drag)"
                    >
                        <Plus size={18} />
                    </button>
                    <button 
                        className="tool-btn bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        onClick={() => {
                           const updates = calculateLayoutUpdates([shapes[selectedId]], LAYOUT_TYPES.GRID, shapes[selectedId].x, shapes[selectedId].y);
                           // Actually let's make it smarter: tidy up ALL shapes near the selected one
                           const neighbors = Object.values(shapes).filter(s => 
                              s.id !== selectedId && 
                              Math.sqrt(Math.pow(s.x - shapes[selectedId].x, 2) + Math.pow(s.y - shapes[selectedId].y, 2)) < 500
                           );
                           const toArrange = [shapes[selectedId], ...neighbors];
                           const updatesArr = calculateLayoutUpdates(toArrange, LAYOUT_TYPES.GRID, shapes[selectedId].x, shapes[selectedId].y);
                           activeDoc.transact(() => {
                               updatesArr.forEach(u => {
                                   const prev = yShapesRef.current.get(u.id);
                                   if (prev) yShapesRef.current.set(u.id, { ...prev, x: u.x, y: u.y });
                               });
                           }, 'local');
                            addReaction('🪄', shapes[selectedId].x, shapes[selectedId].y);
                        }}
                        title="Magic Tidy (Grid)"
                    >
                        <MousePointer2 size={18} />
                    </button>
                    {shapes[selectedId]?.type === 'image' && (
                        <>
                            <div className="toolbar-divider" />
                            <button 
                                className="tool-btn bg-indigo-50 text-indigo-600 hover:bg-indigo-100" 
                                onClick={() => {
                                    // Simulated Magic Background Removal
                                    const shape = shapes[selectedId];
                                    activeDoc.transact(() => {
                                        yShapesRef.current.set(selectedId, { ...shape, effect: 'no-bg', opacity: 0.8 });
                                    }, 'local');
                                }} 
                                title="Remove Background (AI)"
                            >
                                <Sparkles size={16} /> <span className="text-[10px] ml-1 font-bold">REMOVE BG</span>
                            </button>
                            <button 
                                className="tool-btn bg-purple-50 text-purple-600 hover:bg-purple-100" 
                                onClick={() => {
                                    // Simulated AI Upscale
                                    const shape = shapes[selectedId];
                                    activeDoc.transact(() => {
                                        yShapesRef.current.set(selectedId, { ...shape, width: shape.width * 1.1, height: shape.height * 1.1, effect: 'upscale' });
                                    }, 'local');
                                }} 
                                title="AI Upscale"
                            >
                                <Zap size={16} /> <span className="text-[10px] ml-1 font-bold">UPSCALE</span>
                            </button>
                        </>
                    )}
                </div>
            </>
        )}

        {/* --- Multi-Select Smart Layout Toolbar --- */}
        {selectedId === null && Object.keys(shapes).length > 1 && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-2 flex items-center gap-2 animate-in slide-in-from-bottom-4">
                <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-widest mr-1">
                    Smart Layout
                </div>
                <button 
                    className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition flex flex-col items-center gap-1"
                    onClick={() => {
                        const allShapes = Object.values(shapes).filter(s => s.type !== 'line');
                        const updates = calculateLayoutUpdates(allShapes, LAYOUT_TYPES.GRID, 100, 100);
                        activeDoc.transact(() => {
                            updates.forEach(u => {
                                const prev = yShapesRef.current.get(u.id);
                                if (prev) yShapesRef.current.set(u.id, { ...prev, x: u.x, y: u.y });
                            });
                        }, 'local');
                    }}
                    title="Arrange as Grid"
                >
                    <Grid3X3 size={16} />
                    <span className="text-[8px] font-bold">GRID</span>
                </button>
                <button 
                    className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition flex flex-col items-center gap-1"
                    onClick={() => {
                        const allShapes = Object.values(shapes).filter(s => s.type !== 'line');
                        const updates = calculateLayoutUpdates(allShapes, LAYOUT_TYPES.CIRCLE, 100, 100);
                        activeDoc.transact(() => {
                            updates.forEach(u => {
                                const prev = yShapesRef.current.get(u.id);
                                if (prev) yShapesRef.current.set(u.id, { ...prev, x: u.x, y: u.y });
                            });
                        }, 'local');
                    }}
                    title="Arrange as Circle"
                >
                    <CircleIcon size={16} />
                    <span className="text-[8px] font-bold">CIRCLE</span>
                </button>
                <button 
                    className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition flex flex-col items-center gap-1"
                    onClick={() => {
                        const allShapes = Object.values(shapes).filter(s => s.type !== 'line');
                        const updates = calculateLayoutUpdates(allShapes, LAYOUT_TYPES.MIND_MAP, 400, 400);
                        activeDoc.transact(() => {
                            updates.forEach(u => {
                                const prev = yShapesRef.current.get(u.id);
                                if (prev) yShapesRef.current.set(u.id, { ...prev, x: u.x, y: u.y });
                            });
                        }, 'local');
                    }}
                    title="Radial Mind Map"
                >
                    <Workflow size={16} />
                    <span className="text-[8px] font-bold">MIND MAP</span>
                </button>
                <button 
                    className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition flex flex-col items-center gap-1"
                    onClick={() => {
                        const allShapes = Object.values(shapes).filter(s => s.type !== 'line');
                        const updates = calculateLayoutUpdates(allShapes, LAYOUT_TYPES.SPIRAL, 400, 400);
                        activeDoc.transact(() => {
                            updates.forEach(u => {
                                const prev = yShapesRef.current.get(u.id);
                                if (prev) yShapesRef.current.set(u.id, { ...prev, x: u.x, y: u.y });
                            });
                        }, 'local');
                    }}
                    title="Spiral Layout"
                >
                    <RotateCcw size={16} />
                    <span className="text-[8px] font-bold">SPIRAL</span>
                </button>
            </div>
        )}
      </div>

      <div className="connection-status animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'transparent', boxShadow: 'none', right: '1.5rem', top: '1.5rem', padding: 0 }}>
        <div style={{ background: '#0f172a', borderRadius: '12px', padding: '2px', display: 'flex' }}>
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '8px 16px', borderRadius: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', backdropFilter: 'blur(10px)' }}>
          <div className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
          <span className="status-text" style={{ marginRight: 0 }}>{connected ? 'Live' : 'Offline'}</span>
        </div>
        <div style={{ background: 'white', display: 'flex', alignItems: 'center', borderRadius: '30px', padding: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
           <AvatarStack users={stackUsers} onAvatarClick={handleAvatarClick} />
        </div>
        <button 
          onClick={toggleBroadcasting}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all shadow-lg ${
            isBroadcastingView 
              ? 'bg-red-600 text-white animate-pulse-red' 
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          {isBroadcastingView ? (
            <><div className="w-2 h-2 bg-white rounded-full animate-ping" /> STOP LIVE</>
          ) : (
            <><Zap size={14} className="text-yellow-500 fill-yellow-500" /> GO LIVE</>
          )}
        </button>
      </div>

      <UserProfile 
         provider={providerRef.current}
         isVisible={isProfileOpen} 
         onClose={() => setIsProfileOpen(false)} 
      />

      <CallPanel
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        socket={socketRef.current}
        roomId={roomId}
        currentUser={currentUser}
        ydoc={activeDoc}
        viewportCenter={{ 
          x: (-stagePos.x + window.innerWidth / 2) / stageScale,
          y: (-stagePos.y + window.innerHeight / 2) / stageScale 
        }}
        remoteCursors={remoteCursors}
        stageScale={stageScale}
      />

      {incomingCall && !isCallOpen && (
        <div className="absolute top-20 right-6 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-[10000] overflow-hidden animate-in fade-in slide-in-from-top-4">
          <div className="p-4 flex flex-col items-center justify-center bg-gray-50 text-center gap-2">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-bounce mb-2">
              <Phone size={24} />
            </div>
            <h3 className="font-semibold text-gray-800">Incoming Call</h3>
            <p className="text-sm text-gray-500 mb-2">A collaborator has started a voice/video call in this room.</p>
            <div className="flex gap-3 w-full mt-2">
              <button 
                onClick={() => setIncomingCall(false)}
                className="flex-1 py-2 px-4 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors font-medium text-sm"
              >
                 Decline
              </button>
              <button 
                onClick={() => {
                  setIncomingCall(false);
                  setIsCallOpen(true);
                }}
                className="flex-1 py-2 px-4 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors font-medium text-sm shadow-sm"
              >
                 Accept
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="zoom-indicator animate-fade-in shadow-xl">
        <button 
          className={`zoom-btn ${isRecording ? 'text-red-500 bg-red-50' : ''}`}
          onClick={() => {
            if (isRecording) {
                const rec = recordingServiceRef.current.stop();
                setIsRecording(false);
                recordingServiceRef.current.download(rec);
            } else {
                recordingServiceRef.current.start();
                setIsRecording(true);
            }
          }}
          title={isRecording ? "Stop Recording" : "Record Session"}
        >
            <div className={`w-3 h-3 rounded-full mr-1 ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-[10px] font-bold mr-2">{isRecording ? "STOP" : "REC"}</span>
        </button>
        <div className="w-[1px] h-4 bg-gray-200 mr-2" />
        <button className="zoom-btn" onClick={() => setStageScale(s => Math.max(0.1, s / 1.15))}><Minus size={14} /></button>
        <span className="zoom-value">{zoomPercent}%</span>
        <button className="zoom-btn" onClick={() => setStageScale(s => Math.min(5, s * 1.15))}><Plus size={14} /></button>
        <button className="zoom-btn" onClick={resetView} title="Reset View"><RotateCcw size={13} /></button>
      </div>

      <Minimap 
        shapes={shapes}
        stickyNotes={stickyNotes}
        stagePos={stagePos}
        stageScale={stageScale}
        onNavigate={(pos) => updateViewportPos(pos)}
      />

      <PhysicsWorld 
        shapes={shapes}
        stickyNotes={stickyNotes}
        isEnabled={isPhysicsEnabled || isSandboxMode}
        isSandbox={isSandboxMode}
        onUpdate={handlePhysicsUpdate}
      />


      <ActivityHeatmap 
        isOpen={isHeatmapEnabled}
        cursors={remoteCursors}
        stagePos={stagePos}
        stageScale={stageScale}
      />

      <ScenePanel 
        isOpen={isScenesOpen} 
        onClose={() => setIsScenesOpen(false)} 
        ydoc={activeDoc}
        stagePos={stagePos}
        stageScale={stageScale}
        onTransitionTo={handleTransitionTo}
        shapes={shapes}
        followUserId={followUserId}
        remoteCursors={remoteCursors}
      />

      <div 
        className={`canvas-depth-wrapper ${is3DEnabled ? 'depth-active' : ''}`}
        style={{
          perspective: '1500px',
          width: '100vw',
          height: '100vh',
          transform: is3DEnabled 
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` 
            : 'none',
          transition: isPanning ? 'none' : 'transform 0.1s ease-out'
        }}
      >

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
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Layer 1: Background Grid (Passive) - Transparent to show Aura */}
        <Layer listening={false} name="grid-layer">
          <Rect
            x={-stagePos.x / stageScale - 5000}
            y={-stagePos.y / stageScale - 5000}
            width={window.innerWidth / stageScale + 10000}
            height={window.innerHeight / stageScale + 10000}
            fill="transparent"
            listening={false}
          />
        </Layer>

        {/* Layer 2: Static Shapes (Highly Optimized) */}
        <Layer name="static-shapes-layer">
          {Object.entries(connectors).map(([id, conn]) => {
            if (!conn.fromPoint || !conn.toPoint) return null;
            const fromShape = shapes[conn.fromShapeId];
            const toShape = shapes[conn.toShapeId];
            if (!fromShape || !toShape) return null;

            const pts = computeConnectorPoints(fromShape, toShape, conn.routingType || 'bezier');
            
            return (
              <Group key={id}>
                <Line
                  points={pts.points}
                  stroke={conn.color}
                  strokeWidth={3}
                  bezier={pts.bezier}
                  hitStrokeWidth={10}
                  onDblClick={() => {
                    if (tool === 'select') removeConnector(id);
                  }}
                />
              </Group>
            );
          })}
          {renderedShapes}
        </Layer>

        {editingLabelId && (
          <Layer>
            <Html>
              <div 
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100vh',
                  background: 'rgba(0,0,0,0.1)',
                  zIndex: 2000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={handleSaveLabel}
              >
                <div 
                  className="bg-white p-2 rounded-lg shadow-2xl border flex flex-col gap-2 scale-in animate-in duration-200"
                  onClick={e => e.stopPropagation()}
                >
                  <textarea
                    autoFocus
                    className="w-64 h-32 p-3 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                    value={editingLabelText}
                    onChange={e => setEditingLabelText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSaveLabel();
                      }
                      if (e.key === 'Escape') {
                        setEditingLabelId(null);
                      }
                    }}
                  />
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setEditingLabelId(null)}
                      className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveLabel}
                      className="px-3 py-1 text-xs bg-indigo-600 text-white hover:bg-indigo-700 rounded shadow-sm"
                    >
                      Save Label
                    </button>
                  </div>
                </div>
              </div>
            </Html>
          </Layer>
        )}

        {/* Layer 3: Active/Interactive Items (Cursors, Notes, Current Line, Transformers) */}
        <Layer name="active-layer">
          {activeConnector && (
            <Line
                points={[activeConnector.from.x, activeConnector.from.y, activeConnector.to.x, activeConnector.to.y]}
                stroke={color}
                strokeWidth={3}
                dash={[10, 5]}
            />
          )}
          {Object.entries(stickyNotes).map(([id, noteMap]) => (
            <StickyNoteItem key={id} id={id} noteMap={noteMap} onDelete={deleteNote} />
          ))}
          {currentShape && (
            currentShape.type === 'line' ? <Line points={currentShape.points} stroke={currentShape.color} strokeWidth={currentShape.strokeWidth} tension={0.5} lineCap="round" lineJoin="round" /> :
            currentShape.type === 'rect' ? <Rect x={currentShape.x} y={currentShape.y} width={currentShape.width} height={currentShape.height} stroke={currentShape.color} strokeWidth={currentShape.strokeWidth} dash={[6, 3]} /> :
            currentShape.type === 'circle' ? <Ellipse x={currentShape.x} y={currentShape.y} radiusX={currentShape.radiusX} radiusY={currentShape.radiusY} stroke={currentShape.color} strokeWidth={currentShape.strokeWidth} dash={[6, 3]} /> :
            currentShape.type === 'dimension' ? <DimensionLine points={currentShape.points} color={currentShape.color} strokeWidth={currentShape.strokeWidth} /> :
            currentShape.type === 'chart' || currentShape.type === 'iframe' ? <Rect x={currentShape.x} y={currentShape.y} width={currentShape.width} height={currentShape.height} stroke="#6366f1" strokeWidth={2} dash={[6, 3]} /> :
            null
          )}
          {Object.entries(remoteCursors).map(([clientId, cursor]) => (
            cursor && (
              <Group key={clientId} listening={false}>
                <Circle x={cursor.x} y={cursor.y} radius={6 / stageScale} fill={cursor.color} opacity={0.9} />
                <Circle x={cursor.x} y={cursor.y} radius={10 / stageScale} stroke={cursor.color} strokeWidth={1.5 / stageScale} opacity={0.4} />
                <Text x={cursor.x + 14 / stageScale} y={cursor.y + 4 / stageScale} text={cursor.name} fontSize={12 / stageScale} fill={cursor.color} fontFamily="Inter, sans-serif" fontStyle="600" />
              </Group>
            )
          ))}
          {tool === 'select' && <Transformer ref={transformerRef} borderDash={[3, 3]} anchorCornerRadius={3} />}
        </Layer>

        <CommentIndicator 
          shapes={shapes}
          unresolvedShapeIds={unresolvedShapeIds}
          comments={allComments}
          stageScale={stageScale}
          onBadgeClick={(shapeId, pos) => {
            setActiveCommentThread({ shapeId, pos });
          }}
        />

      </Stage>
      </div>
      
      {/* Overlay for Floating Emojis (Screen Space, but coordinate-offset for canvas sync) */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 9999 }}>
        {reactions.map(r => (
          <div
            key={r.id}
            style={{
              position: 'absolute',
              left: r.x * stageScale + stagePos.x,
              top: r.y * stageScale + stagePos.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <FloatingEmoji reaction={r} />
          </div>
        ))}

        {/* Reaction Burst Particles */}
        {particles.map(p => (
           <div
             key={p.id}
             style={{
               position: 'absolute',
               left: p.x * stageScale + stagePos.x,
               top: p.y * stageScale + stagePos.y,
               fontSize: `${24 * p.life}px`,
               opacity: p.life,
               transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
               pointerEvents: 'none',
             }}
           >
             {p.emoji}
           </div>
        ))}

        {/* Cursor Trails (Ghost Effects) */}
        {cursorTrail.map((p, i) => (
            <div 
                key={p.id}
                style={{
                    position: 'absolute',
                    left: p.x,
                    top: p.y,
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: currentUser.color,
                    opacity: (1 - i / cursorTrail.length) * 0.3,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                }}
            />
        ))}

        {/* Local Cursor Chat */}
        {isChatting && (
            <CursorChat 
                isLocal={true}
                x={stageRef.current.getPointerPosition().x}
                y={stageRef.current.getPointerPosition().y}
                color={currentUser.color}
                value={chatText}
                onChange={(val) => {
                    setChatText(val);
                    providerRef.current.awareness.setLocalStateField('chatText', val);
                }}
                onFinish={() => {
                    setIsChatting(false);
                    setTimeout(() => {
                        setChatText('');
                        providerRef.current.awareness.setLocalStateField('chatText', '');
                    }, 3000); // Keep bubble visible for 3s
                }}
            />
        )}

        {/* Remote Cursor Chats */}
        {Object.entries(remoteCursors).map(([clientId, cursor]) => {
            const remoteState = providerRef.current.awareness.getStates().get(clientId);
            if (remoteState?.chatText) {
                return (
                    <CursorChat 
                        key={clientId}
                        isLocal={false}
                        x={cursor.x * stageScale + stagePos.x}
                        y={cursor.y * stageScale + stagePos.y}
                        color={cursor.color}
                        value={remoteState.chatText}
                    />
                );
            }
            return null;
        })}

        {/* Floating Comment Thread Overlay */}
        {activeCommentThread && (
          <CommentThread 
            shapeId={activeCommentThread.shapeId}
            comments={allComments[activeCommentThread.shapeId] || []}
            position={{
                x: activeCommentThread.pos.x * stageScale + stagePos.x + 20,
                y: activeCommentThread.pos.y * stageScale + stagePos.y - 20
            }}
            currentUser={currentUser}
            roomMembers={stackUsers}
            onClose={() => setActiveCommentThread(null)}
            onAddComment={(shapeId, comment) => {
                addComment(shapeId, comment);
                
                // Emit notification
                const shape = shapes[shapeId];
                if (shape && socketRef.current) {
                    socketRef.current.emit('comment-notify', {
                        roomId,
                        shapeCreatorId: shape.creatorId || 'admin', // Future proofing
                        commenterName: currentUser.name
                    });
                    
                    // Check for @mentions in text to emit mention notifications
                    const mentions = comment.text.match(/@(\S+)/g);
                    if (mentions) {
                        mentions.forEach(m => {
                            const name = m.substring(1);
                            // Find user by name in stackUsers
                            const mentionedUser = stackUsers.find(u => u.name === name);
                            if (mentionedUser && mentionedUser.id !== currentUser.id) {
                                socketRef.current.emit('mention-notify', {
                                    roomId,
                                    mentionedUserId: mentionedUser.id,
                                    mentionerName: currentUser.name
                                });
                            }
                        });
                    }
                }
            }}
            onResolveThread={(shapeId) => resolveThread(shapeId)}
            onDeleteComment={(shapeId, commentId) => deleteComment(shapeId, commentId)}
          />
        )}
      </div>
      
      {reactionWheelPos && (
          <ReactionWheel 
            x={reactionWheelPos.x}
            y={reactionWheelPos.y}
            onSelect={(emoji) => {
                const relX = (reactionWheelPos.x - stagePos.x) / stageScale;
                const relY = (reactionWheelPos.y - stagePos.y) / stageScale;
                addReactionWithBurst(emoji, relX, relY);
                setReactionWheelPos(null);
            }}
            onClose={() => setReactionWheelPos(null)}
          />
      )}

      <MobileToolbar 
        tool={tool}
        color={color}
        onToolChange={setTool}
        onColorChange={setColor}
        onUndo={() => undoManagerRef.current?.undo()}
        onClear={handleClear}
        is3DEnabled={is3DEnabled}
        onToggle3D={() => setIs3DEnabled(!is3DEnabled)}
        isSketchMode={isSketchMode}
        onToggleSketch={() => setIsSketchMode(!isSketchMode)}
      />

      <HistoryScrubber 
        undoManager={undoManagerRef.current}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <CodeExportPanel 
        isOpen={isCodeExportOpen}
        onClose={() => setIsCodeExportOpen(false)}
        selectedShapes={selectedId ? [shapes[selectedId]].filter(Boolean) : []}
      />

      <AIImageStudio 
        isOpen={isAIImageOpen} 
        onClose={() => setIsAIImageOpen(false)} 
        ydoc={activeDoc} 
        viewportCenter={{ 
          x: (-stagePos.x + window.innerWidth / 2) / stageScale,
          y: (-stagePos.y + window.innerHeight / 2) / stageScale 
        }} 
      />

      <TicTacToeWidget 
        isOpen={isTicTacToeOpen} 
        onClose={() => setIsTicTacToeOpen(false)} 
        ydoc={activeDoc} 
        currentUser={currentUser} 
      />

      <AnimatePresence>
        {isPollCreationOpen && (
          <PollCreationModal 
            onClose={() => setIsPollCreationOpen(false)} 
            onCreate={(data) => {
              const viewportCenter = { 
                x: (-stagePos.x + window.innerWidth / 2) / stageScale,
                y: (-stagePos.y + window.innerHeight / 2) / stageScale 
              };
              createPoll({ ...data, x: viewportCenter.x, y: viewportCenter.y });
            }} 
          />
        )}
      </AnimatePresence>

      {Object.values(polls).map(poll => (
        <PollWidget 
          key={poll.id}
          poll={poll}
          currentUserId={currentUser.id}
          onVote={vote}
          onClose={() => deletePoll(poll.id)}
          getTotalVotes={getTotalVotes}
          getVoteCount={getVoteCount}
        />
      ))}

      <AgendaSidebar 
        isOpen={isAgendaOpen}
        onClose={() => setIsAgendaOpen(false)}
        items={agendaItems}
        notes={agendaNotes}
        currentItemId={currentItemId}
        onAddItem={addAgendaItem}
        onRemoveItem={removeAgendaItem}
        onSetCurrentItem={setAgendaCurrentItem}
        onUpdateNotes={updateAgendaNotes}
        onExportNotes={exportAgendaNotes}
        currentUser={currentUser}
      />

      {isRecording && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-600 text-white rounded-full flex items-center gap-2 shadow-xl z-[10000] animate-pulse">
          <div className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span className="text-xs font-bold uppercase tracking-widest">Recording Session...</span>
        </div>
      )}

      <VoiceControl 
        ydoc={activeDoc}
        viewportCenter={{
          x: (window.innerWidth / 2 - stagePos.x) / stageScale,
          y: (window.innerHeight / 2 - stagePos.y) / stageScale
        }}
        stageScale={stageScale}
        setStageScale={setStageScale}
        setStagePos={setStagePos}
        setTool={setTool}
        onAIAction={(open) => setIsAIOpen(open)}
      />
      </div>

      {isTimerOpen && (
        <TimerWidget 
          {...timerProps} 
          onClose={() => setIsTimerOpen(false)} 
        />
      )}

      <AnalyticsPanel 
        isOpen={isAnalyticsOpen} 
        onClose={() => setIsAnalyticsOpen(false)} 
        stats={stats} 
        loading={analyticsLoading} 
      />

      <ShareModal 
        isOpen={isShareOpen} 
        onClose={() => setIsShareOpen(false)} 
        settings={settings} 
        onUpdateVisibility={updateVisibility} 
        onInviteMember={inviteMember} 
        onRemoveMember={removeMember} 
        loading={settingsLoading} 
      />

      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onCommand={handleCommand}
      />

      {isPortalOpen && (
        <Portal3D 
          shapes={shapes}
          stickyNotes={stickyNotes}
          onClose={() => setIsPortalOpen(false)}
        />
      )}

      <AutomationPanel 
        isOpen={isAutomationOpen}
        onClose={() => setIsAutomationOpen(false)}
        ydoc={activeDoc}
        shapes={shapes}
      />

      <ThemeGenerator 
        isOpen={isThemeGeneratorOpen}
        onClose={() => setIsThemeGeneratorOpen(false)}
        onApplyTheme={(theme) => {
            activeDoc.transact(() => {
                // Apply theme colors to all shapes!
                Object.entries(shapes).forEach(([id, s]) => {
                    if (s.type !== 'line' && s.type !== 'image') {
                        yShapesRef.current.set(id, { ...s, color: theme.primary, fontFamily: theme.font });
                    }
                });
            }, 'local');
            setIsThemeGeneratorOpen(false);
            addReaction('🎨', window.innerWidth/2, window.innerHeight/2);
        }}
      />

      <Soundboard 
        isOpen={isSoundboardOpen}
        onClose={() => setIsSoundboardOpen(false)}
        onPlaySound={(sound) => {
            if (socketRef.current) {
                socketRef.current.emit('play-sound', { url: sound.url, id: sound.id });
            }
            // Also play locally
            const audio = new Audio(sound.url);
            audio.volume = 0.5;
            audio.play();
            addReaction('🔊', window.innerWidth/2, window.innerHeight/2);
        }}
      />
    </div>
  );
}

function MobileToolbar({ 
    tool, color, onToolChange, onColorChange, onUndo, onClear, 
    is3DEnabled, onToggle3D, isSketchMode, onToggleSketch 
}) {
    return (
        <div className="mobile-toolbar-wrapper md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000] flex items-center gap-3 px-6 py-4 bg-white/70 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl transition-all duration-300 hover:bg-white/80">
            <button 
                onClick={() => onToolChange('pen')}
                className={`p-2.5 rounded-full transition-all ${tool === 'pen' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}
            >
                <Pencil size={20} />
            </button>
            <button 
                onClick={() => onToolChange('rect')}
                className={`p-2.5 rounded-full transition-all ${tool === 'rect' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}
            >
                <Square size={20} />
            </button>
            <button 
                onClick={() => onToolChange('circle')}
                className={`p-2.5 rounded-full transition-all ${tool === 'circle' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}
            >
                <CircleIcon size={20} />
            </button>
            
            <div className="w-[1px] h-6 bg-slate-200/50" />
            
            <button 
                onClick={onToggle3D}
                className={`p-2.5 rounded-full transition-all ${is3DEnabled ? 'bg-amber-100 text-amber-600 shadow-inner' : 'text-slate-400 hover:bg-slate-100'}`}
            >
                <Box size={20} />
            </button>
            
            <button 
                onClick={onToggleSketch}
                className={`p-2.5 rounded-full transition-all ${isSketchMode ? 'bg-pink-100 text-pink-600 shadow-inner' : 'text-slate-400 hover:bg-slate-100'}`}
            >
                <Highlighter size={20} />
            </button>
            
            <div className="w-[1px] h-6 bg-slate-200/50" />

            <button 
                onClick={onUndo}
                className="p-2.5 rounded-full text-slate-600 hover:bg-slate-100 transition-all"
            >
                <Undo2 size={20} />
            </button>
            
            <div className="relative group">
                <div 
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer overflow-hidden"
                    style={{ backgroundColor: color }}
                />
                <input 
                    type="color" 
                    value={color}
                    onChange={(e) => onColorChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                />
            </div>
        </div>
    );
}

import CADApp from './cad/CADApp.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/${generateRoomId()}`} replace />} />
      <Route path="/cad" element={<CADApp />} />
      <Route path="/:roomId" element={<Whiteboard />} />
    </Routes>
  );
}
