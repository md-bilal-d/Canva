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
 * Computes points for a connector between two shapes.
 * Supports 'bezier' (default) or 'orthogonal' routing.
 */
export function computeConnectorPoints(fromShape, toShape, routingType = 'bezier', allShapes = {}) {
  if (!fromShape || !toShape) return null;

  const fromCenter = getShapeCenter(fromShape);
  const toCenter = getShapeCenter(toShape);

  // 1. Get the best edge points
  const fromPt = getEdgePoint(fromShape, toCenter.x, toCenter.y);
  const toPt = getEdgePoint(toShape, fromCenter.x, fromCenter.y);

  if (routingType === 'orthogonal') {
    // Generate orthogonal path points (Manhattan routing)
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
      bezier: false
    };
  } else if (routingType === 'magic') {
    // Advanced Orthogonal (Pseudo-A* for obstacle avoidance)
    // For performance, we'll do a simple bounding-box check to route around the most obvious obstacle
    // A full A* grid search is too heavy for real-time React render
    const points = [];
    points.push(fromPt.x, fromPt.y);

    const midX = (fromPt.x + toPt.x) / 2;
    const midY = (fromPt.y + toPt.y) / 2;

    let useHorizontalExit = (fromPt.side === 'left' || fromPt.side === 'right');
    
    // Quick check if mid path hits an obstacle
    let hitsObstacle = false;
    let obstacleBox = null;
    
    const checkLineObstacle = (x1, y1, x2, y2) => {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        
        for (const [id, shape] of Object.entries(allShapes)) {
            if (id === fromShape.id || id === toShape.id) continue;
            const sx = shape.scaleX || 1;
            const sy = shape.scaleY || 1;
            const w = (shape.width || shape.radiusX * 2 || 100) * sx;
            const h = (shape.height || shape.radiusY * 2 || 100) * sy;
            const cx = shape.x;
            const cy = shape.y;
            
            // Check intersection with shape bounding box (inflated by padding)
            const pad = 20;
            if (!(maxX < cx - pad || minX > cx + w + pad || maxY < cy - pad || minY > cy + h + pad)) {
                return { cx, cy, w, h };
            }
        }
        return null;
    };

    if (useHorizontalExit) {
        obstacleBox = checkLineObstacle(fromPt.x, fromPt.y, midX, fromPt.y) || checkLineObstacle(midX, fromPt.y, midX, toPt.y);
        if (obstacleBox) {
            // Route around
            const yOffset = obstacleBox.cy < midY ? obstacleBox.h + 40 : -40;
            points.push(midX, fromPt.y);
            points.push(midX, obstacleBox.cy + yOffset);
            points.push(toPt.x, obstacleBox.cy + yOffset);
        } else {
            points.push(midX, fromPt.y);
            points.push(midX, toPt.y);
        }
    } else {
        obstacleBox = checkLineObstacle(fromPt.x, fromPt.y, fromPt.x, midY) || checkLineObstacle(fromPt.x, midY, toPt.x, midY);
        if (obstacleBox) {
            const xOffset = obstacleBox.cx < midX ? obstacleBox.w + 40 : -40;
            points.push(fromPt.x, midY);
            points.push(obstacleBox.cx + xOffset, midY);
            points.push(obstacleBox.cx + xOffset, toPt.y);
        } else {
            points.push(fromPt.x, midY);
            points.push(toPt.x, midY);
        }
    }

    points.push(toPt.x, toPt.y);

    return {
      from: fromPt,
      to: toPt,
      points: points,
      bezier: false
    };
  } else {
    // Bezier routing
    const fx = fromPt.x, fy = fromPt.y, tx = toPt.x, ty = toPt.y;
    // Simple 4-point bezier curve
    const cp1x = fromPt.side === 'left' ? fx - 100 : fromPt.side === 'right' ? fx + 100 : fx;
    const cp1y = fromPt.side === 'top' ? fy - 100 : fromPt.side === 'bottom' ? fy + 100 : fy;
    const cp2x = toPt.side === 'left' ? tx - 100 : toPt.side === 'right' ? tx + 100 : tx;
    const cp2y = toPt.side === 'top' ? ty - 100 : toPt.side === 'bottom' ? ty + 100 : ty;

    return {
      from: fromPt,
      to: toPt,
      points: [fx, fy, cp1x, cp1y, cp2x, cp2y, tx, ty],
      bezier: true
    };
  }
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
