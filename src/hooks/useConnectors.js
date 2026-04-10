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
 * Given two shapes, compute bezier-curve-friendly start and end points
 * plus two control points for a smooth curve.
 */
export function computeConnectorPoints(fromShape, toShape) {
  if (!fromShape || !toShape) return null;

  // Get center points for the "other" shape to determine edge direction
  const fromCenter = getShapeCenter(fromShape);
  const toCenter = getShapeCenter(toShape);

  const fromPt = getEdgePoint(fromShape, toCenter.x, toCenter.y);
  const toPt = getEdgePoint(toShape, fromCenter.x, fromCenter.y);

  // Compute control points for a nice bezier curve
  const dx = toPt.x - fromPt.x;
  const dy = toPt.y - fromPt.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const offset = Math.min(dist * 0.4, 120);

  const cp1 = getControlOffset(fromPt, offset);
  const cp2 = getControlOffset(toPt, offset);

  return {
    from: fromPt,
    to: toPt,
    cp1,
    cp2,
    points: [fromPt.x, fromPt.y, cp1.x, cp1.y, cp2.x, cp2.y, toPt.x, toPt.y],
  };
}

function getShapeCenter(shape) {
  if (shape.type === 'rect') {
    const sx = shape.scaleX || 1;
    const sy = shape.scaleY || 1;
    return {
      x: shape.x + (shape.width * sx) / 2,
      y: shape.y + (shape.height * sy) / 2,
    };
  }
  return { x: shape.x || 0, y: shape.y || 0 };
}

function getControlOffset(point, offset) {
  switch (point.side) {
    case 'top':    return { x: point.x, y: point.y - offset };
    case 'bottom': return { x: point.x, y: point.y + offset };
    case 'left':   return { x: point.x - offset, y: point.y };
    case 'right':  return { x: point.x + offset, y: point.y };
    default:       return { x: point.x, y: point.y };
  }
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
