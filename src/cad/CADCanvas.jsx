// CADCanvas.jsx — Core canvas engine with coordinate system, grid, pan/zoom, HUD
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { hitTest } from './cadGeometry.js';
import { snapPoint, drawSnapIndicator } from './cadSnapEngine.js';

const BG_COLOR = '#0d1117';
const GRID_MINOR_COLOR = '#1e2730';
const GRID_MAJOR_COLOR = '#2d3f50';
const AXIS_X_COLOR = 'rgba(255,80,80,0.35)';
const AXIS_Y_COLOR = 'rgba(80,255,80,0.35)';
const CROSSHAIR_COLOR = '#e6edf355';
const SELECTION_HIGHLIGHT = '#58a6ff';
const MIN_ZOOM = 0.01;
const MAX_ZOOM = 100;
const MINOR_GRID = 10;
const MAJOR_GRID = 100;

export default function CADCanvas({
  entities,
  selectedIds,
  viewState,
  setViewState,
  snapSettings,
  gridSize = 10,
  activeTool,
  toolInstance,
  onCanvasClick,
  onCanvasMove,
  onCanvasUp,
  dimensions = [],
  hatches = [],
}) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const spaceDown = useRef(false);
  const [mouseWorld, setMouseWorld] = useState({ x: 0, y: 0 });
  const [currentSnap, setCurrentSnap] = useState(null);
  const mouseScreen = useRef({ x: 0, y: 0 });

  // ─── COORDINATE TRANSFORMS ─────────────────────────────────
  const screenToWorld = useCallback((sx, sy) => {
    const { panX, panY, zoom } = viewState;
    return {
      x: (sx - panX) / zoom,
      y: -(sy - panY) / zoom,  // Y-flip
    };
  }, [viewState]);

  const worldToScreen = useCallback((wx, wy) => {
    const { panX, panY, zoom } = viewState;
    return {
      x: wx * zoom + panX,
      y: -wy * zoom + panY,
    };
  }, [viewState]);

  // ─── RENDER ENTITY ─────────────────────────────────────────
  const renderEntity = useCallback((ctx, ent, isSelected) => {
    const { zoom, panX, panY } = viewState;
    const ts = (x, y) => ({ x: x * zoom + panX, y: -y * zoom + panY });

    ctx.save();
    ctx.strokeStyle = isSelected ? SELECTION_HIGHLIGHT : (ent.color || '#e6edf3');
    ctx.fillStyle = isSelected ? SELECTION_HIGHLIGHT : (ent.color || '#e6edf3');
    ctx.lineWidth = (ent.lineWidth || 1) * (isSelected ? 1.8 : 1);

    if (ent.lineType === 'dashed' || ent.lineType === 'center') {
      ctx.setLineDash([6, 4]);
    }

    switch (ent.type) {
      case 'line': {
        const a = ts(ent.x1, ent.y1);
        const b = ts(ent.x2, ent.y2);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        break;
      }
      case 'circle': {
        const c = ts(ent.cx, ent.cy);
        ctx.beginPath();
        ctx.arc(c.x, c.y, ent.radius * zoom, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case 'arc': {
        const c = ts(ent.cx, ent.cy);
        ctx.beginPath();
        // Y-flip means angles are negated and direction reverses
        ctx.arc(c.x, c.y, ent.radius * zoom, -ent.startAngle, -ent.endAngle, true);
        ctx.stroke();
        break;
      }
      case 'rectangle': {
        const a = ts(ent.x, ent.y + ent.height);
        ctx.beginPath();
        ctx.rect(a.x, a.y, ent.width * zoom, ent.height * zoom);
        ctx.stroke();
        break;
      }
      case 'polyline': {
        if (ent.points.length < 2) break;
        ctx.beginPath();
        const first = ts(ent.points[0].x, ent.points[0].y);
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < ent.points.length; i++) {
          const p = ts(ent.points[i].x, ent.points[i].y);
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        break;
      }
      case 'polygon': {
        if (ent.points.length < 3) break;
        ctx.beginPath();
        const first2 = ts(ent.points[0].x, ent.points[0].y);
        ctx.moveTo(first2.x, first2.y);
        for (let i = 1; i < ent.points.length; i++) {
          const p = ts(ent.points[i].x, ent.points[i].y);
          ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.stroke();
        break;
      }
      case 'text': {
        const p = ts(ent.x, ent.y);
        const fontSize = Math.max(8, ent.fontSize * zoom);
        ctx.font = `${fontSize}px "JetBrains Mono", "Fira Code", monospace`;
        ctx.textBaseline = 'bottom';

        if (ent.angle) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(-ent.angle);
          ctx.fillText(ent.text, 0, 0);
          ctx.restore();
        } else {
          ctx.fillText(ent.text, p.x, p.y);
        }
        break;
      }
    }

    // Selection handles
    if (isSelected) {
      ctx.setLineDash([]);
      ctx.fillStyle = SELECTION_HIGHLIGHT;
      const drawHandle = (sx, sy) => {
        ctx.fillRect(sx - 3, sy - 3, 6, 6);
      };
      switch (ent.type) {
        case 'line': {
          const a = ts(ent.x1, ent.y1);
          const b = ts(ent.x2, ent.y2);
          drawHandle(a.x, a.y);
          drawHandle(b.x, b.y);
          break;
        }
        case 'circle': {
          const c = ts(ent.cx, ent.cy);
          drawHandle(c.x, c.y);
          drawHandle(c.x + ent.radius * zoom, c.y);
          break;
        }
        case 'rectangle': {
          const corners = [
            ts(ent.x, ent.y),
            ts(ent.x + ent.width, ent.y),
            ts(ent.x + ent.width, ent.y + ent.height),
            ts(ent.x, ent.y + ent.height),
          ];
          corners.forEach(c => drawHandle(c.x, c.y));
          break;
        }
      }
    }

    ctx.restore();
  }, [viewState]);

  // ─── MAIN RENDER LOOP ──────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const { panX, panY, zoom } = viewState;

    // Clear
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    // ── Grid ──
    const minorStep = MINOR_GRID * zoom;
    const majorStep = MAJOR_GRID * zoom;

    // Only draw grid if it's visible (> 3px apart)
    if (minorStep > 3) {
      ctx.strokeStyle = GRID_MINOR_COLOR;
      ctx.lineWidth = 0.5;
      ctx.beginPath();

      const startWorldX = Math.floor((-panX / zoom) / MINOR_GRID) * MINOR_GRID;
      const endWorldX = Math.ceil(((w - panX) / zoom) / MINOR_GRID) * MINOR_GRID;
      const startWorldY = Math.floor((-(h - panY) / zoom) / MINOR_GRID) * MINOR_GRID;
      const endWorldY = Math.ceil((panY / zoom) / MINOR_GRID) * MINOR_GRID;

      for (let wx = startWorldX; wx <= endWorldX; wx += MINOR_GRID) {
        if (wx % MAJOR_GRID === 0) continue;
        const sx = wx * zoom + panX;
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, h);
      }
      for (let wy = startWorldY; wy <= endWorldY; wy += MINOR_GRID) {
        if (wy % MAJOR_GRID === 0) continue;
        const sy = -wy * zoom + panY;
        ctx.moveTo(0, sy);
        ctx.lineTo(w, sy);
      }
      ctx.stroke();
    }

    // Major grid
    if (majorStep > 3) {
      ctx.strokeStyle = GRID_MAJOR_COLOR;
      ctx.lineWidth = 0.8;
      ctx.beginPath();

      const startMX = Math.floor((-panX / zoom) / MAJOR_GRID) * MAJOR_GRID;
      const endMX = Math.ceil(((w - panX) / zoom) / MAJOR_GRID) * MAJOR_GRID;
      const startMY = Math.floor((-(h - panY) / zoom) / MAJOR_GRID) * MAJOR_GRID;
      const endMY = Math.ceil((panY / zoom) / MAJOR_GRID) * MAJOR_GRID;

      for (let wx = startMX; wx <= endMX; wx += MAJOR_GRID) {
        const sx = wx * zoom + panX;
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, h);
      }
      for (let wy = startMY; wy <= endMY; wy += MAJOR_GRID) {
        const sy = -wy * zoom + panY;
        ctx.moveTo(0, sy);
        ctx.lineTo(w, sy);
      }
      ctx.stroke();
    }

    // ── Origin Axes ──
    ctx.lineWidth = 1.2;
    // X axis (red)
    ctx.strokeStyle = AXIS_X_COLOR;
    ctx.beginPath();
    ctx.moveTo(0, panY);
    ctx.lineTo(w, panY);
    ctx.stroke();
    // Y axis (green)
    ctx.strokeStyle = AXIS_Y_COLOR;
    ctx.beginPath();
    ctx.moveTo(panX, 0);
    ctx.lineTo(panX, h);
    ctx.stroke();

    // Origin crosshair dot
    ctx.fillStyle = '#ffffff66';
    ctx.beginPath();
    ctx.arc(panX, panY, 3, 0, Math.PI * 2);
    ctx.fill();

    // ── Hatches (behind entities) ──
    for (const hatch of hatches) {
      if (hatch.render) hatch.render(ctx, viewState);
    }

    // ── Entities ──
    const entArr = entities instanceof Map ? [...entities.values()] : (entities || []);
    for (const ent of entArr) {
      if (ent.visible === false) continue;
      if (ent.id && ent.id.startsWith('__')) continue;
      renderEntity(ctx, ent, selectedIds?.has(ent.id));
    }

    // ── Preview entities from active tool ──
    if (toolInstance?.getPreviewEntities) {
      for (const prev of toolInstance.getPreviewEntities()) {
        renderEntity(ctx, prev, false);
      }
    }

    // ── Dimensions ──
    for (const dim of dimensions) {
      if (dim.render) dim.render(ctx, viewState);
    }

    // ── Snap indicator ──
    if (currentSnap) {
      drawSnapIndicator(ctx, currentSnap, viewState);
    }

    // ── Crosshair cursor ──
    const mx = mouseScreen.current.x;
    const my = mouseScreen.current.y;
    ctx.strokeStyle = CROSSHAIR_COLOR;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(mx, 0);
    ctx.lineTo(mx, h);
    ctx.moveTo(0, my);
    ctx.lineTo(w, my);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── HUD: Coordinates (bottom-left) ──
    const hudY = h - 16;
    ctx.fillStyle = '#0d1117cc';
    ctx.fillRect(0, h - 36, 260, 36);
    ctx.fillStyle = '#7ee787';
    ctx.font = '13px "JetBrains Mono", "Fira Code", monospace';
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'left';
    ctx.fillText(
      `X: ${mouseWorld.x.toFixed(2)}   Y: ${mouseWorld.y.toFixed(2)}`,
      12,
      hudY
    );

    // ── HUD: Zoom (bottom-right) ──
    ctx.fillStyle = '#0d1117cc';
    ctx.fillRect(w - 140, h - 36, 140, 36);
    ctx.fillStyle = '#79c0ff';
    ctx.textAlign = 'right';
    ctx.fillText(
      `Zoom: ${(zoom * 100).toFixed(0)}%`,
      w - 16,
      hudY
    );

    // ── HUD: Snap type (bottom-left second line) ──
    if (currentSnap) {
      ctx.fillStyle = '#0d1117cc';
      ctx.fillRect(0, h - 56, 180, 22);
      ctx.fillStyle = '#ffa657';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`⊕ ${currentSnap.snapType.toUpperCase()}`, 12, h - 40);
    }

    // Schedule next frame
    animRef.current = requestAnimationFrame(render);
  }, [viewState, entities, selectedIds, toolInstance, currentSnap, mouseWorld, dimensions, hatches, renderEntity]);

  // ─── CANVAS RESIZE ─────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ─── RENDER LOOP ───────────────────────────────────────────
  useEffect(() => {
    animRef.current = requestAnimationFrame(render);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [render]);

  // ─── CENTER VIEW ON MOUNT ─────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setViewState({
      panX: canvas.width / 2,
      panY: canvas.height / 2,
      zoom: 1,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── KEYBOARD (space for pan) ──────────────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        spaceDown.current = true;
      }
    };
    const onKeyUp = (e) => {
      if (e.code === 'Space') spaceDown.current = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // ─── MOUSE HANDLERS ───────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    // Middle mouse or Space+Left = Pan
    if (e.button === 1 || (e.button === 0 && spaceDown.current)) {
      e.preventDefault();
      isPanning.current = true;
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        panX: viewState.panX,
        panY: viewState.panY,
      };
      return;
    }

    if (e.button !== 0) return;

    // Get world coords with snap
    const world = screenToWorld(sx, sy);
    const entArr = entities instanceof Map ? [...entities.values()] : (entities || []);
    const snapped = snapPoint(world.x, world.y, entArr, snapSettings, gridSize, 15 / viewState.zoom);
    const point = snapped || world;

    onCanvasClick?.({
      x: point.x,
      y: point.y,
      screenX: sx,
      screenY: sy,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      snap: snapped,
    });
  }, [viewState, screenToWorld, entities, snapSettings, gridSize, onCanvasClick]);

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    mouseScreen.current = { x: sx, y: sy };

    // Panning
    if (isPanning.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setViewState({
        panX: panStart.current.panX + dx,
        panY: panStart.current.panY + dy,
      });
      return;
    }

    const world = screenToWorld(sx, sy);
    const entArr = entities instanceof Map ? [...entities.values()] : (entities || []);
    const snapped = snapPoint(world.x, world.y, entArr, snapSettings, gridSize, 15 / viewState.zoom);

    const point = snapped || world;
    setMouseWorld({ x: point.x, y: point.y });
    setCurrentSnap(snapped);

    onCanvasMove?.({
      x: point.x,
      y: point.y,
      screenX: sx,
      screenY: sy,
      snap: snapped,
    });
  }, [viewState, screenToWorld, entities, snapSettings, gridSize, setViewState, onCanvasMove]);

  const handleMouseUp = useCallback((e) => {
    if (isPanning.current) {
      isPanning.current = false;
      return;
    }

    if (e.button !== 0) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(sx, sy);
    const entArr = entities instanceof Map ? [...entities.values()] : (entities || []);
    const snapped = snapPoint(world.x, world.y, entArr, snapSettings, gridSize, 15 / viewState.zoom);
    const point = snapped || world;

    onCanvasUp?.({
      x: point.x,
      y: point.y,
      screenX: sx,
      screenY: sy,
      shiftKey: e.shiftKey,
      snap: snapped,
    });
  }, [viewState, screenToWorld, entities, snapSettings, gridSize, onCanvasUp]);

  // Zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewState.zoom * zoomFactor));

    // Zoom centered on cursor
    const newPanX = mx - (mx - viewState.panX) * (newZoom / viewState.zoom);
    const newPanY = my - (my - viewState.panY) * (newZoom / viewState.zoom);

    setViewState({ zoom: newZoom, panX: newPanX, panY: newPanY });
  }, [viewState, setViewState]);

  // Double-click for polyline finish
  const handleDoubleClick = useCallback((e) => {
    if (toolInstance?.onKeyDown) {
      toolInstance.onKeyDown('dblclick');
    }
  }, [toolInstance]);

  // Prevent context menu on middle-click
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        cursor: spaceDown.current || isPanning.current ? 'grab' : 'crosshair',
        display: 'block',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    />
  );
}
