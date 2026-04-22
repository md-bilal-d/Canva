// cadSnapEngine.js — Object Snap engine for CAD
// Returns snap points with type info for visual indicators

import { distanceBetween, snapToGrid } from './cadGeometry.js';

// OSnap types
export const SNAP_TYPES = {
  ENDPOINT: 'endpoint',
  MIDPOINT: 'midpoint',
  CENTER: 'center',
  QUADRANT: 'quadrant',
  INTERSECTION: 'intersection',
  PERPENDICULAR: 'perpendicular',
  TANGENT: 'tangent',
  NEAREST: 'nearest',
  GRID: 'grid',
};

// Visual config per snap type
export const SNAP_VISUALS = {
  [SNAP_TYPES.ENDPOINT]: { color: '#3fb950', shape: 'square', size: 6 },
  [SNAP_TYPES.MIDPOINT]: { color: '#58a6ff', shape: 'triangle', size: 7 },
  [SNAP_TYPES.CENTER]: { color: '#f0883e', shape: 'circle', size: 6 },
  [SNAP_TYPES.QUADRANT]: { color: '#d2a8ff', shape: 'diamond', size: 6 },
  [SNAP_TYPES.INTERSECTION]: { color: '#ff7b72', shape: 'x', size: 6 },
  [SNAP_TYPES.PERPENDICULAR]: { color: '#79c0ff', shape: 'perpendicular', size: 7 },
  [SNAP_TYPES.TANGENT]: { color: '#ffa657', shape: 'tangent', size: 7 },
  [SNAP_TYPES.NEAREST]: { color: '#7ee787', shape: 'hourglass', size: 6 },
  [SNAP_TYPES.GRID]: { color: '#484f58', shape: 'dot', size: 3 },
};

// Priority order (lower index = higher priority)
const PRIORITY = [
  SNAP_TYPES.ENDPOINT,
  SNAP_TYPES.INTERSECTION,
  SNAP_TYPES.CENTER,
  SNAP_TYPES.MIDPOINT,
  SNAP_TYPES.QUADRANT,
  SNAP_TYPES.PERPENDICULAR,
  SNAP_TYPES.TANGENT,
  SNAP_TYPES.NEAREST,
  SNAP_TYPES.GRID,
];

// ─── SNAP HELPERS ───────────────────────────────────────────────

function getEndpoints(entity) {
  switch (entity.type) {
    case 'line':
      return [
        { x: entity.x1, y: entity.y1 },
        { x: entity.x2, y: entity.y2 },
      ];
    case 'arc':
      return [
        {
          x: entity.cx + entity.radius * Math.cos(entity.startAngle),
          y: entity.cy + entity.radius * Math.sin(entity.startAngle),
        },
        {
          x: entity.cx + entity.radius * Math.cos(entity.endAngle),
          y: entity.cy + entity.radius * Math.sin(entity.endAngle),
        },
      ];
    case 'rectangle': {
      const c = [
        { x: entity.x, y: entity.y },
        { x: entity.x + entity.width, y: entity.y },
        { x: entity.x + entity.width, y: entity.y + entity.height },
        { x: entity.x, y: entity.y + entity.height },
      ];
      return c;
    }
    case 'polyline':
      return entity.points.length > 0
        ? [entity.points[0], entity.points[entity.points.length - 1]]
        : [];
    case 'polygon':
      return [...entity.points];
    case 'text':
      return [{ x: entity.x, y: entity.y }];
    default:
      return [];
  }
}

function getMidpoints(entity) {
  switch (entity.type) {
    case 'line':
      return [{ x: (entity.x1 + entity.x2) / 2, y: (entity.y1 + entity.y2) / 2 }];
    case 'arc': {
      let mid = (entity.startAngle + entity.endAngle) / 2;
      if (entity.endAngle < entity.startAngle) mid += Math.PI;
      return [
        {
          x: entity.cx + entity.radius * Math.cos(mid),
          y: entity.cy + entity.radius * Math.sin(mid),
        },
      ];
    }
    case 'rectangle': {
      const c = [
        { x: entity.x, y: entity.y },
        { x: entity.x + entity.width, y: entity.y },
        { x: entity.x + entity.width, y: entity.y + entity.height },
        { x: entity.x, y: entity.y + entity.height },
      ];
      const mids = [];
      for (let i = 0; i < 4; i++) {
        const next = (i + 1) % 4;
        mids.push({ x: (c[i].x + c[next].x) / 2, y: (c[i].y + c[next].y) / 2 });
      }
      return mids;
    }
    case 'polyline': {
      const mids = [];
      for (let i = 0; i < entity.points.length - 1; i++) {
        mids.push({
          x: (entity.points[i].x + entity.points[i + 1].x) / 2,
          y: (entity.points[i].y + entity.points[i + 1].y) / 2,
        });
      }
      return mids;
    }
    case 'polygon': {
      const mids = [];
      for (let i = 0; i < entity.points.length; i++) {
        const next = (i + 1) % entity.points.length;
        mids.push({
          x: (entity.points[i].x + entity.points[next].x) / 2,
          y: (entity.points[i].y + entity.points[next].y) / 2,
        });
      }
      return mids;
    }
    default:
      return [];
  }
}

function getCenters(entity) {
  switch (entity.type) {
    case 'circle':
      return [{ x: entity.cx, y: entity.cy }];
    case 'arc':
      return [{ x: entity.cx, y: entity.cy }];
    case 'rectangle':
      return [{ x: entity.x + entity.width / 2, y: entity.y + entity.height / 2 }];
    default:
      return [];
  }
}

function getQuadrants(entity) {
  if (entity.type === 'circle') {
    return [
      { x: entity.cx + entity.radius, y: entity.cy },
      { x: entity.cx, y: entity.cy + entity.radius },
      { x: entity.cx - entity.radius, y: entity.cy },
      { x: entity.cx, y: entity.cy - entity.radius },
    ];
  }
  return [];
}

// Line-line intersection
function lineLineIntersection(l1, l2) {
  const x1 = l1.x1, y1 = l1.y1, x2 = l1.x2, y2 = l1.y2;
  const x3 = l2.x1, y3 = l2.y1, x4 = l2.x2, y4 = l2.y2;
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-10) return null;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
  }
  return null;
}

function getSegments(entity) {
  switch (entity.type) {
    case 'line':
      return [{ x1: entity.x1, y1: entity.y1, x2: entity.x2, y2: entity.y2 }];
    case 'rectangle': {
      const c = [
        { x: entity.x, y: entity.y },
        { x: entity.x + entity.width, y: entity.y },
        { x: entity.x + entity.width, y: entity.y + entity.height },
        { x: entity.x, y: entity.y + entity.height },
      ];
      return [
        { x1: c[0].x, y1: c[0].y, x2: c[1].x, y2: c[1].y },
        { x1: c[1].x, y1: c[1].y, x2: c[2].x, y2: c[2].y },
        { x1: c[2].x, y1: c[2].y, x2: c[3].x, y2: c[3].y },
        { x1: c[3].x, y1: c[3].y, x2: c[0].x, y2: c[0].y },
      ];
    }
    case 'polyline': {
      const segs = [];
      for (let i = 0; i < entity.points.length - 1; i++) {
        segs.push({
          x1: entity.points[i].x,
          y1: entity.points[i].y,
          x2: entity.points[i + 1].x,
          y2: entity.points[i + 1].y,
        });
      }
      return segs;
    }
    case 'polygon': {
      const segs = [];
      for (let i = 0; i < entity.points.length; i++) {
        const next = (i + 1) % entity.points.length;
        segs.push({
          x1: entity.points[i].x,
          y1: entity.points[i].y,
          x2: entity.points[next].x,
          y2: entity.points[next].y,
        });
      }
      return segs;
    }
    default:
      return [];
  }
}

function getIntersections(entities) {
  const allSegments = [];
  for (const ent of entities) {
    allSegments.push(...getSegments(ent));
  }
  const pts = [];
  for (let i = 0; i < allSegments.length; i++) {
    for (let j = i + 1; j < allSegments.length; j++) {
      const pt = lineLineIntersection(allSegments[i], allSegments[j]);
      if (pt) pts.push(pt);
    }
  }
  return pts;
}

function nearestOnEntity(mx, my, entity) {
  // Return the closest point on the entity
  switch (entity.type) {
    case 'line': {
      const dx = entity.x2 - entity.x1;
      const dy = entity.y2 - entity.y1;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) return { x: entity.x1, y: entity.y1 };
      let t = ((mx - entity.x1) * dx + (my - entity.y1) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
      return { x: entity.x1 + t * dx, y: entity.y1 + t * dy };
    }
    case 'circle': {
      const ang = Math.atan2(my - entity.cy, mx - entity.cx);
      return {
        x: entity.cx + entity.radius * Math.cos(ang),
        y: entity.cy + entity.radius * Math.sin(ang),
      };
    }
    default:
      return null;
  }
}

// ─── MAIN SNAP FUNCTION ─────────────────────────────────────────

/**
 * snapPoint — finds the best snap point near the cursor.
 * @param {number} mouseX — world X
 * @param {number} mouseY — world Y
 * @param {Array} entities — all drawing entities
 * @param {Object} activeOSnaps — { endpoint: true, midpoint: true, ... }
 * @param {number} gridSize
 * @param {number} threshold — snap radius in world units
 * @returns {{ x: number, y: number, snapType: string } | null}
 */
export function snapPoint(mouseX, mouseY, entities, activeOSnaps, gridSize, threshold = 10) {
  const candidates = []; // { x, y, snapType, dist }
  const p = { x: mouseX, y: mouseY };

  const entArr = Array.isArray(entities) ? entities : [...entities.values()];

  // Endpoint snaps
  if (activeOSnaps.endpoint) {
    for (const ent of entArr) {
      for (const ep of getEndpoints(ent)) {
        const d = distanceBetween(p, ep);
        if (d <= threshold) {
          candidates.push({ ...ep, snapType: SNAP_TYPES.ENDPOINT, dist: d });
        }
      }
    }
  }

  // Intersection snaps
  if (activeOSnaps.intersection) {
    for (const ip of getIntersections(entArr)) {
      const d = distanceBetween(p, ip);
      if (d <= threshold) {
        candidates.push({ ...ip, snapType: SNAP_TYPES.INTERSECTION, dist: d });
      }
    }
  }

  // Center snaps
  if (activeOSnaps.center) {
    for (const ent of entArr) {
      for (const cp of getCenters(ent)) {
        const d = distanceBetween(p, cp);
        if (d <= threshold) {
          candidates.push({ ...cp, snapType: SNAP_TYPES.CENTER, dist: d });
        }
      }
    }
  }

  // Midpoint snaps
  if (activeOSnaps.midpoint) {
    for (const ent of entArr) {
      for (const mp of getMidpoints(ent)) {
        const d = distanceBetween(p, mp);
        if (d <= threshold) {
          candidates.push({ ...mp, snapType: SNAP_TYPES.MIDPOINT, dist: d });
        }
      }
    }
  }

  // Quadrant snaps
  if (activeOSnaps.quadrant) {
    for (const ent of entArr) {
      for (const qp of getQuadrants(ent)) {
        const d = distanceBetween(p, qp);
        if (d <= threshold) {
          candidates.push({ ...qp, snapType: SNAP_TYPES.QUADRANT, dist: d });
        }
      }
    }
  }

  // Nearest snap
  if (activeOSnaps.nearest) {
    for (const ent of entArr) {
      const np = nearestOnEntity(mouseX, mouseY, ent);
      if (np) {
        const d = distanceBetween(p, np);
        if (d <= threshold) {
          candidates.push({ ...np, snapType: SNAP_TYPES.NEAREST, dist: d });
        }
      }
    }
  }

  // Grid snap (lowest priority)
  if (activeOSnaps.grid && gridSize > 0) {
    const gp = snapToGrid(mouseX, mouseY, gridSize);
    const d = distanceBetween(p, gp);
    if (d <= threshold) {
      candidates.push({ ...gp, snapType: SNAP_TYPES.GRID, dist: d });
    }
  }

  if (candidates.length === 0) return null;

  // Sort by priority first, then distance
  candidates.sort((a, b) => {
    const pa = PRIORITY.indexOf(a.snapType);
    const pb = PRIORITY.indexOf(b.snapType);
    if (pa !== pb) return pa - pb;
    return a.dist - b.dist;
  });

  const best = candidates[0];
  return { x: best.x, y: best.y, snapType: best.snapType };
}

// ─── DRAW SNAP INDICATOR ────────────────────────────────────────

export function drawSnapIndicator(ctx, snap, viewState) {
  if (!snap) return;
  const vis = SNAP_VISUALS[snap.snapType];
  if (!vis) return;

  // Convert world to screen
  const sx = snap.x * viewState.zoom + viewState.panX;
  const sy = -snap.y * viewState.zoom + viewState.panY; // Y-flip

  ctx.save();
  ctx.strokeStyle = vis.color;
  ctx.fillStyle = vis.color;
  ctx.lineWidth = 2;
  const s = vis.size;

  switch (vis.shape) {
    case 'square':
      ctx.strokeRect(sx - s, sy - s, s * 2, s * 2);
      break;
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(sx, sy - s);
      ctx.lineTo(sx - s, sy + s);
      ctx.lineTo(sx + s, sy + s);
      ctx.closePath();
      ctx.stroke();
      break;
    case 'circle':
      ctx.beginPath();
      ctx.arc(sx, sy, s, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(sx, sy - s);
      ctx.lineTo(sx + s, sy);
      ctx.lineTo(sx, sy + s);
      ctx.lineTo(sx - s, sy);
      ctx.closePath();
      ctx.stroke();
      break;
    case 'x':
      ctx.beginPath();
      ctx.moveTo(sx - s, sy - s);
      ctx.lineTo(sx + s, sy + s);
      ctx.moveTo(sx + s, sy - s);
      ctx.lineTo(sx - s, sy + s);
      ctx.stroke();
      break;
    case 'dot':
      ctx.beginPath();
      ctx.arc(sx, sy, s, 0, Math.PI * 2);
      ctx.fill();
      break;
    default:
      ctx.beginPath();
      ctx.arc(sx, sy, s, 0, Math.PI * 2);
      ctx.stroke();
      break;
  }

  ctx.restore();
}
