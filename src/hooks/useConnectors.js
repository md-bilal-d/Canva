// ============================================================
// useConnectors — Connector/Arrow state management via Yjs
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Y from 'yjs';

/**
 * Computes the closest edge-center point on a shape facing toward a target point.
 * Supports rect (x, y, width, height) and circle/ellipse (x, y, radiusX, radiusY).
 */
function getEdgePoint(shape, targetX, targetY) {
  let cx, cy, hw, hh;

  if (shape.type === 'rect') {
    const sx = shape.scaleX || 1;
    const sy = shape.scaleY || 1;
    hw = (shape.width * sx) / 2;
    hh = (shape.height * sy) / 2;
    cx = shape.x + hw;
    cy = shape.y + hh;
  } else if (shape.type === 'circle') {
    const sx = shape.scaleX || 1;
    const sy = shape.scaleY || 1;
    cx = shape.x;
    cy = shape.y;
    hw = (shape.radiusX || 50) * sx;
    hh = (shape.radiusY || 50) * sy;
  } else {
    // Fallback: treat as a point
    return { x: shape.x || 0, y: shape.y || 0, side: 'center' };
  }

  // Candidate edge-center points
  const points = [
    { x: cx, y: cy - hh, side: 'top' },
    { x: cx + hw, y: cy, side: 'right' },
    { x: cx, y: cy + hh, side: 'bottom' },
    { x: cx - hw, y: cy, side: 'left' },
  ];

  let best = points[0];
  let bestDist = Infinity;

  for (const p of points) {
    const dx = p.x - targetX;
    const dy = p.y - targetY;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }

  return best;
}

/**
 * Computes a smart orthogonal path between two shapes.
 * Returns an array of points [x1, y1, x2, y2, ...] for a Line or Arrow.
 */
export function computeConnectorPoints(fromShape, toShape) {
  if (!fromShape || !toShape) return null;

  const fromCenter = getShapeCenter(fromShape);
  const toCenter = getShapeCenter(toShape);

  // 1. Get the best edge points
  const fromPt = getEdgePoint(fromShape, toCenter.x, toCenter.y);
  const toPt = getEdgePoint(toShape, fromCenter.x, fromCenter.y);

  // 2. Generate orthogonal path points
  // We'll use a 3-segment or 5-segment approach
  const points = [];
  points.push(fromPt.x, fromPt.y);

  const midX = (fromPt.x + toPt.x) / 2;
  const midY = (fromPt.y + toPt.y) / 2;

  if (fromPt.side === 'left' || fromPt.side === 'right') {
    // Horizontal exit
    points.push(midX, fromPt.y);
    points.push(midX, toPt.y);
  } else {
    // Vertical exit
    points.push(fromPt.x, midY);
    points.push(toPt.x, midY);
  }

  points.push(toPt.x, toPt.y);

  return {
    from: fromPt,
    to: toPt,
    points: points,
    bezier: false // Switch to straight segments for clean orthogonal look
  };
}

function getShapeCenter(shape) {
  const sx = shape.scaleX || 1;
  const sy = shape.scaleY || 1;
  if (shape.type === 'rect') {
    return {
      x: shape.x + (shape.width * sx) / 2,
      y: shape.y + (shape.height * sy) / 2,
    };
  } else if (shape.type === 'circle') {
    return { x: shape.x, y: shape.y };
  }
  return { x: shape.x || 0, y: shape.y || 0 };
}

/**
 * Returns all four edge-center points for rendering connection dots.
 */
export function getShapeEdgePoints(shape) {
  if (!shape) return [];
  let cx, cy, hw, hh;

  if (shape.type === 'rect') {
    const sx = shape.scaleX || 1;
    const sy = shape.scaleY || 1;
    hw = (shape.width * sx) / 2;
    hh = (shape.height * sy) / 2;
    cx = shape.x + hw;
    cy = shape.y + hh;
  } else if (shape.type === 'circle') {
    const sx = shape.scaleX || 1;
    const sy = shape.scaleY || 1;
    cx = shape.x;
    cy = shape.y;
    hw = (shape.radiusX || 50) * sx;
    hh = (shape.radiusY || 50) * sy;
  } else {
    return [];
  }

  return [
    { x: cx, y: cy - hh, side: 'top' },
    { x: cx + hw, y: cy, side: 'right' },
    { x: cx, y: cy + hh, side: 'bottom' },
    { x: cx - hw, y: cy, side: 'left' },
  ];
}

export default function useConnectors(ydoc) {
  const [connectors, setConnectors] = useState({});
  const yConnectorsRef = useRef(null);

  useEffect(() => {
    if (!ydoc) return;

    const yConnectors = ydoc.getMap('connectors');
    yConnectorsRef.current = yConnectors;

    const observe = () => {
      const map = {};
      yConnectors.forEach((val, key) => {
        map[key] = val;
      });
      setConnectors(map);
    };

    yConnectors.observeDeep(observe);
    observe();

    return () => {
      yConnectors.unobserveDeep(observe);
    };
  }, [ydoc]);

  const addConnector = useCallback((connector) => {
    const yConnectors = yConnectorsRef.current;
    if (!yConnectors) return;

    const id = connector.id || 'conn-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    yConnectors.doc.transact(() => {
      yConnectors.set(id, {
        id,
        fromShapeId: connector.fromShapeId,
        toShapeId: connector.toShapeId,
        fromPoint: connector.fromPoint || null,
        toPoint: connector.toPoint || null,
        color: connector.color || '#6366f1',
        label: connector.label || '',
      });
    }, 'local');

    return id;
  }, []);

  const removeConnector = useCallback((id) => {
    const yConnectors = yConnectorsRef.current;
    if (!yConnectors) return;
    yConnectors.doc.transact(() => {
      yConnectors.delete(id);
    }, 'local');
  }, []);

  const updateConnector = useCallback((id, updates) => {
    const yConnectors = yConnectorsRef.current;
    if (!yConnectors) return;
    const existing = yConnectors.get(id);
    if (!existing) return;
    yConnectors.doc.transact(() => {
      yConnectors.set(id, { ...existing, ...updates });
    }, 'local');
  }, []);

  /**
   * Recalculate endpoints for all connectors attached to a given shape.
   * Call this after a shape drag ends.
   */
  const recalculateForShape = useCallback((shapeId, allShapes) => {
    const yConnectors = yConnectorsRef.current;
    if (!yConnectors) return;

    yConnectors.doc.transact(() => {
      yConnectors.forEach((conn, id) => {
        if (conn.fromShapeId === shapeId || conn.toShapeId === shapeId) {
          const fromShape = allShapes[conn.fromShapeId];
          const toShape = allShapes[conn.toShapeId];
          if (fromShape && toShape) {
            const pts = computeConnectorPoints(fromShape, toShape);
            if (pts) {
              yConnectors.set(id, {
                ...conn,
                fromPoint: pts.from,
                toPoint: pts.to,
              });
            }
          }
        }
      });
    }, 'local');
  }, []);

  return { connectors, addConnector, removeConnector, updateConnector, recalculateForShape };
}
