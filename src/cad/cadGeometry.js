// cadGeometry.js — Pure geometry engine (no React)
// Primitives & utility functions for the CAD application

let _nextId = 1;
export function generateId() {
  return `ent_${Date.now()}_${_nextId++}`;
}

// ─── BASE ENTITY ────────────────────────────────────────────────
class Entity {
  constructor(type, props = {}) {
    this.type = type;
    this.id = props.id || generateId();
    this.layer = props.layer || '0';
    this.color = props.color || '#e6edf3';
    this.lineWidth = props.lineWidth ?? 1;
    this.visible = props.visible ?? true;
    this.locked = props.locked ?? false;
  }

  clone() {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), structuredClone({ ...this }));
  }

  serialize() {
    return { ...this };
  }
}

// ─── PRIMITIVES ─────────────────────────────────────────────────
export class Line extends Entity {
  constructor(x1, y1, x2, y2, props = {}) {
    super('line', props);
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }

  getEndpoints() {
    return [
      { x: this.x1, y: this.y1 },
      { x: this.x2, y: this.y2 },
    ];
  }

  getMidpoint() {
    return { x: (this.x1 + this.x2) / 2, y: (this.y1 + this.y2) / 2 };
  }

  getLength() {
    return Math.hypot(this.x2 - this.x1, this.y2 - this.y1);
  }
}

export class Circle extends Entity {
  constructor(cx, cy, radius, props = {}) {
    super('circle', props);
    this.cx = cx;
    this.cy = cy;
    this.radius = radius;
  }

  getCenter() {
    return { x: this.cx, y: this.cy };
  }

  getQuadrants() {
    return [
      { x: this.cx + this.radius, y: this.cy },
      { x: this.cx, y: this.cy + this.radius },
      { x: this.cx - this.radius, y: this.cy },
      { x: this.cx, y: this.cy - this.radius },
    ];
  }
}

export class Arc extends Entity {
  constructor(cx, cy, radius, startAngle, endAngle, props = {}) {
    super('arc', props);
    this.cx = cx;
    this.cy = cy;
    this.radius = radius;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
  }

  getCenter() {
    return { x: this.cx, y: this.cy };
  }

  getEndpoints() {
    return [
      {
        x: this.cx + this.radius * Math.cos(this.startAngle),
        y: this.cy + this.radius * Math.sin(this.startAngle),
      },
      {
        x: this.cx + this.radius * Math.cos(this.endAngle),
        y: this.cy + this.radius * Math.sin(this.endAngle),
      },
    ];
  }

  getMidpoint() {
    let mid = (this.startAngle + this.endAngle) / 2;
    if (this.endAngle < this.startAngle) mid += Math.PI;
    return {
      x: this.cx + this.radius * Math.cos(mid),
      y: this.cy + this.radius * Math.sin(mid),
    };
  }
}

export class Rectangle extends Entity {
  constructor(x, y, width, height, props = {}) {
    super('rectangle', props);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  getCorners() {
    return [
      { x: this.x, y: this.y },
      { x: this.x + this.width, y: this.y },
      { x: this.x + this.width, y: this.y + this.height },
      { x: this.x, y: this.y + this.height },
    ];
  }

  getCenter() {
    return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
  }

  getEndpoints() {
    return this.getCorners();
  }

  getMidpoint() {
    const c = this.getCorners();
    return [
      { x: (c[0].x + c[1].x) / 2, y: (c[0].y + c[1].y) / 2 },
      { x: (c[1].x + c[2].x) / 2, y: (c[1].y + c[2].y) / 2 },
      { x: (c[2].x + c[3].x) / 2, y: (c[2].y + c[3].y) / 2 },
      { x: (c[3].x + c[0].x) / 2, y: (c[3].y + c[0].y) / 2 },
    ];
  }
}

export class Polyline extends Entity {
  constructor(points, props = {}) {
    super('polyline', props);
    this.points = points; // [{x,y}, ...]
  }

  getEndpoints() {
    if (this.points.length < 1) return [];
    return [this.points[0], this.points[this.points.length - 1]];
  }

  getMidpoints() {
    const mids = [];
    for (let i = 0; i < this.points.length - 1; i++) {
      mids.push({
        x: (this.points[i].x + this.points[i + 1].x) / 2,
        y: (this.points[i].y + this.points[i + 1].y) / 2,
      });
    }
    return mids;
  }

  getLength() {
    let len = 0;
    for (let i = 0; i < this.points.length - 1; i++) {
      len += Math.hypot(
        this.points[i + 1].x - this.points[i].x,
        this.points[i + 1].y - this.points[i].y
      );
    }
    return len;
  }
}

export class Polygon extends Entity {
  constructor(points, props = {}) {
    super('polygon', props);
    this.points = points; // [{x,y}, ...]
  }

  getEndpoints() {
    return [...this.points];
  }

  getMidpoints() {
    const mids = [];
    for (let i = 0; i < this.points.length; i++) {
      const next = (i + 1) % this.points.length;
      mids.push({
        x: (this.points[i].x + this.points[next].x) / 2,
        y: (this.points[i].y + this.points[next].y) / 2,
      });
    }
    return mids;
  }
}

export class Text extends Entity {
  constructor(x, y, text, fontSize = 12, angle = 0, props = {}) {
    super('text', props);
    this.x = x;
    this.y = y;
    this.text = text;
    this.fontSize = fontSize;
    this.angle = angle;
  }

  getEndpoints() {
    return [{ x: this.x, y: this.y }];
  }
}

// ─── GEOMETRY UTILITIES ─────────────────────────────────────────

export function snapToGrid(x, y, gridSize) {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize,
  };
}

export function distanceBetween(p1, p2) {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

export function angleBetween(p1, p2) {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

function getAllEndpoints(entity) {
  if (typeof entity.getEndpoints === 'function') return entity.getEndpoints();
  return [];
}

function getAllMidpoints(entity) {
  if (entity.type === 'line') return [entity.getMidpoint()];
  if (typeof entity.getMidpoints === 'function') return entity.getMidpoints();
  if (typeof entity.getMidpoint === 'function') {
    const m = entity.getMidpoint();
    return Array.isArray(m) ? m : [m];
  }
  return [];
}

export function snapToPoint(x, y, entities, threshold) {
  let best = null;
  let bestDist = threshold;
  for (const ent of entities) {
    for (const ep of getAllEndpoints(ent)) {
      const d = distanceBetween({ x, y }, ep);
      if (d < bestDist) {
        bestDist = d;
        best = ep;
      }
    }
  }
  return best;
}

export function snapToEndpoint(x, y, entities, threshold) {
  return snapToPoint(x, y, entities, threshold);
}

export function snapToMidpoint(x, y, entities, threshold) {
  let best = null;
  let bestDist = threshold;
  for (const ent of entities) {
    for (const mp of getAllMidpoints(ent)) {
      const d = distanceBetween({ x, y }, mp);
      if (d < bestDist) {
        bestDist = d;
        best = mp;
      }
    }
  }
  return best;
}

// ─── HIT TEST ───────────────────────────────────────────────────

export function hitTest(x, y, entity, tolerance = 5) {
  const p = { x, y };

  switch (entity.type) {
    case 'line': {
      return distPointToSegment(p, { x: entity.x1, y: entity.y1 }, { x: entity.x2, y: entity.y2 }) <= tolerance;
    }
    case 'circle': {
      const d = distanceBetween(p, { x: entity.cx, y: entity.cy });
      return Math.abs(d - entity.radius) <= tolerance;
    }
    case 'arc': {
      const d = distanceBetween(p, { x: entity.cx, y: entity.cy });
      if (Math.abs(d - entity.radius) > tolerance) return false;
      let angle = Math.atan2(y - entity.cy, x - entity.cx);
      if (angle < 0) angle += Math.PI * 2;
      let start = entity.startAngle % (Math.PI * 2);
      let end = entity.endAngle % (Math.PI * 2);
      if (start < 0) start += Math.PI * 2;
      if (end < 0) end += Math.PI * 2;
      if (start <= end) return angle >= start && angle <= end;
      return angle >= start || angle <= end;
    }
    case 'rectangle': {
      const corners = entity.getCorners();
      for (let i = 0; i < 4; i++) {
        const next = (i + 1) % 4;
        if (distPointToSegment(p, corners[i], corners[next]) <= tolerance) return true;
      }
      return false;
    }
    case 'polyline': {
      for (let i = 0; i < entity.points.length - 1; i++) {
        if (distPointToSegment(p, entity.points[i], entity.points[i + 1]) <= tolerance) return true;
      }
      return false;
    }
    case 'polygon': {
      for (let i = 0; i < entity.points.length; i++) {
        const next = (i + 1) % entity.points.length;
        if (distPointToSegment(p, entity.points[i], entity.points[next]) <= tolerance) return true;
      }
      return false;
    }
    case 'text': {
      const approxW = entity.text.length * entity.fontSize * 0.6;
      const approxH = entity.fontSize;
      return (
        x >= entity.x - tolerance &&
        x <= entity.x + approxW + tolerance &&
        y >= entity.y - approxH - tolerance &&
        y <= entity.y + tolerance
      );
    }
    default:
      return false;
  }
}

function distPointToSegment(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return distanceBetween(p, a);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return distanceBetween(p, { x: a.x + t * dx, y: a.y + t * dy });
}

// ─── BOUNDING BOX ───────────────────────────────────────────────

export function getBoundingBox(entities) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  const update = (x, y) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };

  for (const ent of entities) {
    switch (ent.type) {
      case 'line':
        update(ent.x1, ent.y1);
        update(ent.x2, ent.y2);
        break;
      case 'circle':
        update(ent.cx - ent.radius, ent.cy - ent.radius);
        update(ent.cx + ent.radius, ent.cy + ent.radius);
        break;
      case 'arc':
        update(ent.cx - ent.radius, ent.cy - ent.radius);
        update(ent.cx + ent.radius, ent.cy + ent.radius);
        break;
      case 'rectangle':
        update(ent.x, ent.y);
        update(ent.x + ent.width, ent.y + ent.height);
        break;
      case 'polyline':
      case 'polygon':
        for (const p of ent.points) update(p.x, p.y);
        break;
      case 'text':
        update(ent.x, ent.y);
        update(ent.x + ent.text.length * ent.fontSize * 0.6, ent.y + ent.fontSize);
        break;
      default:
        break;
    }
  }

  return { minX, minY, maxX, maxY };
}
