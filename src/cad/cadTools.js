// cadTools.js — Drawing tool state machines
// Each tool class: onMouseDown, onMouseMove, onMouseUp, onKeyDown, getPreviewEntities, getHint, reset

import {
  Line, Circle, Arc, Rectangle, Polyline, Polygon, Text,
  hitTest, distanceBetween, angleBetween, generateId,
} from './cadGeometry.js';

// ─── BASE TOOL ──────────────────────────────────────────────────
class BaseTool {
  constructor(name) {
    this.name = name;
    this._preview = [];
    this._hint = '';
    this._finished = false;
    this._result = null;
  }
  onMouseDown(/* point */) {}
  onMouseMove(/* point */) {}
  onMouseUp(/* point */) {}
  onKeyDown(/* key, value */) {}
  getPreviewEntities() { return this._preview; }
  getHint() { return this._hint; }
  isFinished() { return this._finished; }
  getResult() { return this._result; }
  reset() {
    this._preview = [];
    this._hint = '';
    this._finished = false;
    this._result = null;
  }
}

// ─── SELECT TOOL ────────────────────────────────────────────────
export class SelectTool extends BaseTool {
  constructor() {
    super('select');
    this.dragStart = null;
    this.dragging = false;
    this.selectionRect = null;
    this._hint = 'Click to select, drag to box-select';
  }

  onMouseDown(point, ctx) {
    this.dragStart = { ...point };
    this.dragging = false;
    this.selectionRect = null;
  }

  onMouseMove(point) {
    if (this.dragStart) {
      const dx = point.x - this.dragStart.x;
      const dy = point.y - this.dragStart.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        this.dragging = true;
        this.selectionRect = {
          x: Math.min(this.dragStart.x, point.x),
          y: Math.min(this.dragStart.y, point.y),
          width: Math.abs(dx),
          height: Math.abs(dy),
        };
        this._preview = [new Rectangle(
          this.selectionRect.x, this.selectionRect.y,
          this.selectionRect.width, this.selectionRect.height,
          { color: '#58a6ff', lineWidth: 0.5, id: '__selection_rect__' }
        )];
      }
    }
  }

  onMouseUp(point, entities, shiftKey) {
    if (this.dragging && this.selectionRect) {
      // Box select — find entities in rectangle
      const r = this.selectionRect;
      const ids = [];
      const entArr = entities instanceof Map ? [...entities.values()] : entities;
      for (const ent of entArr) {
        if (isEntityInRect(ent, r)) {
          ids.push(ent.id);
        }
      }
      this._result = { type: 'box-select', ids, additive: shiftKey };
    } else {
      // Click select — hit test
      const entArr = entities instanceof Map ? [...entities.values()] : entities;
      let hit = null;
      for (const ent of entArr) {
        if (hitTest(point.x, point.y, ent, 8)) {
          hit = ent.id;
          break;
        }
      }
      this._result = { type: 'click-select', id: hit, additive: shiftKey };
    }
    this._finished = true;
    this.dragStart = null;
    this.dragging = false;
    this._preview = [];
  }

  reset() {
    super.reset();
    this.dragStart = null;
    this.dragging = false;
    this.selectionRect = null;
    this._hint = 'Click to select, drag to box-select';
  }
}

function isEntityInRect(ent, rect) {
  const pts = [];
  switch (ent.type) {
    case 'line':
      pts.push({ x: ent.x1, y: ent.y1 }, { x: ent.x2, y: ent.y2 });
      break;
    case 'circle':
      pts.push(
        { x: ent.cx - ent.radius, y: ent.cy - ent.radius },
        { x: ent.cx + ent.radius, y: ent.cy + ent.radius }
      );
      break;
    case 'rectangle':
      pts.push({ x: ent.x, y: ent.y }, { x: ent.x + ent.width, y: ent.y + ent.height });
      break;
    case 'polyline':
    case 'polygon':
      pts.push(...ent.points);
      break;
    case 'text':
      pts.push({ x: ent.x, y: ent.y });
      break;
    default:
      return false;
  }
  return pts.every(
    p => p.x >= rect.x && p.x <= rect.x + rect.width &&
         p.y >= rect.y && p.y <= rect.y + rect.height
  );
}

// ─── LINE TOOL ──────────────────────────────────────────────────
export class LineTool extends BaseTool {
  constructor() {
    super('line');
    this.p1 = null;
    this.currentPoint = null;
    this._hint = 'Specify first point:';
  }

  onMouseDown(point) {
    if (!this.p1) {
      this.p1 = { ...point };
      this._hint = 'Specify next point:';
    } else {
      this._result = new Line(this.p1.x, this.p1.y, point.x, point.y);
      this._finished = true;
      // Chain: last endpoint becomes next start
      this.p1 = { ...point };
    }
  }

  onMouseMove(point) {
    this.currentPoint = { ...point };
    if (this.p1) {
      this._preview = [
        new Line(this.p1.x, this.p1.y, point.x, point.y, {
          color: '#58a6ff', lineWidth: 0.5, id: '__preview_line__',
        }),
      ];
    }
  }

  onKeyDown(key) {
    if (key === 'Escape') {
      this.reset();
    }
  }

  reset() {
    super.reset();
    this.p1 = null;
    this.currentPoint = null;
    this._hint = 'Specify first point:';
  }
}

// ─── POLYLINE TOOL ──────────────────────────────────────────────
export class PolylineTool extends BaseTool {
  constructor() {
    super('polyline');
    this.points = [];
    this.currentPoint = null;
    this._hint = 'Specify first point:';
  }

  onMouseDown(point, ctx) {
    this.points.push({ ...point });
    this._hint = `Specify next point (${this.points.length} points) [Enter/double-click to finish]:`;
  }

  onMouseMove(point) {
    this.currentPoint = { ...point };
    if (this.points.length > 0) {
      const allPts = [...this.points, point];
      this._preview = [new Polyline(allPts, { color: '#58a6ff', lineWidth: 0.5, id: '__preview_polyline__' })];
    }
  }

  onKeyDown(key) {
    if ((key === 'Enter' || key === 'dblclick') && this.points.length >= 2) {
      this._result = new Polyline([...this.points]);
      this._finished = true;
    } else if (key === 'Escape') {
      this.reset();
    }
  }

  reset() {
    super.reset();
    this.points = [];
    this.currentPoint = null;
    this._hint = 'Specify first point:';
  }
}

// ─── RECTANGLE TOOL ─────────────────────────────────────────────
export class RectangleTool extends BaseTool {
  constructor() {
    super('rectangle');
    this.p1 = null;
    this._hint = 'Specify first corner:';
  }

  onMouseDown(point) {
    if (!this.p1) {
      this.p1 = { ...point };
      this._hint = 'Specify opposite corner:';
    } else {
      const x = Math.min(this.p1.x, point.x);
      const y = Math.min(this.p1.y, point.y);
      const w = Math.abs(point.x - this.p1.x);
      const h = Math.abs(point.y - this.p1.y);
      this._result = new Rectangle(x, y, w, h);
      this._finished = true;
    }
  }

  onMouseMove(point) {
    if (this.p1) {
      const x = Math.min(this.p1.x, point.x);
      const y = Math.min(this.p1.y, point.y);
      const w = Math.abs(point.x - this.p1.x);
      const h = Math.abs(point.y - this.p1.y);
      this._preview = [new Rectangle(x, y, w, h, {
        color: '#58a6ff', lineWidth: 0.5, id: '__preview_rect__',
      })];
    }
  }

  onKeyDown(key) {
    if (key === 'Escape') this.reset();
  }

  reset() {
    super.reset();
    this.p1 = null;
    this._hint = 'Specify first corner:';
  }
}

// ─── CIRCLE TOOL ────────────────────────────────────────────────
export class CircleTool extends BaseTool {
  constructor() {
    super('circle');
    this.center = null;
    this._hint = 'Specify center point:';
  }

  onMouseDown(point) {
    if (!this.center) {
      this.center = { ...point };
      this._hint = 'Specify radius (click or type value):';
    } else {
      const r = distanceBetween(this.center, point);
      this._result = new Circle(this.center.x, this.center.y, r);
      this._finished = true;
    }
  }

  onMouseMove(point) {
    if (this.center) {
      const r = distanceBetween(this.center, point);
      this._preview = [new Circle(this.center.x, this.center.y, r, {
        color: '#58a6ff', lineWidth: 0.5, id: '__preview_circle__',
      })];
    }
  }

  onKeyDown(key, value) {
    if (key === 'Enter' && this.center && value) {
      const r = parseFloat(value);
      if (!isNaN(r) && r > 0) {
        this._result = new Circle(this.center.x, this.center.y, r);
        this._finished = true;
      }
    } else if (key === 'Escape') {
      this.reset();
    }
  }

  reset() {
    super.reset();
    this.center = null;
    this._hint = 'Specify center point:';
  }
}

// ─── ARC TOOL (3-point) ────────────────────────────────────────
export class ArcTool extends BaseTool {
  constructor() {
    super('arc');
    this.p1 = null;
    this.p2 = null;
    this._hint = 'Specify start point:';
  }

  onMouseDown(point) {
    if (!this.p1) {
      this.p1 = { ...point };
      this._hint = 'Specify point on arc:';
    } else if (!this.p2) {
      this.p2 = { ...point };
      this._hint = 'Specify end point:';
    } else {
      const arc = threePointArc(this.p1, this.p2, point);
      if (arc) {
        this._result = arc;
        this._finished = true;
      }
    }
  }

  onMouseMove(point) {
    if (this.p1 && !this.p2) {
      this._preview = [new Line(this.p1.x, this.p1.y, point.x, point.y, {
        color: '#58a6ff', lineWidth: 0.5, id: '__preview_arc_guide__',
      })];
    } else if (this.p1 && this.p2) {
      const arc = threePointArc(this.p1, this.p2, point);
      if (arc) {
        arc.color = '#58a6ff';
        arc.lineWidth = 0.5;
        arc.id = '__preview_arc__';
        this._preview = [arc];
      }
    }
  }

  onKeyDown(key) {
    if (key === 'Escape') this.reset();
  }

  reset() {
    super.reset();
    this.p1 = null;
    this.p2 = null;
    this._hint = 'Specify start point:';
  }
}

function threePointArc(p1, p2, p3) {
  // Calculate circle through 3 points
  const ax = p1.x, ay = p1.y;
  const bx = p2.x, by = p2.y;
  const cx = p3.x, cy = p3.y;
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(d) < 1e-10) return null;
  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
  const r = Math.hypot(ax - ux, ay - uy);
  const startAngle = Math.atan2(ay - uy, ax - ux);
  const endAngle = Math.atan2(cy - uy, cx - ux);
  return new Arc(ux, uy, r, startAngle, endAngle);
}

// ─── POLYGON TOOL ───────────────────────────────────────────────
export class PolygonTool extends BaseTool {
  constructor() {
    super('polygon');
    this.center = null;
    this.sides = 6;
    this._hint = 'Specify center point:';
  }

  onMouseDown(point) {
    if (!this.center) {
      this.center = { ...point };
      this._hint = `Specify radius (${this.sides} sides) [type side count]:`;
    } else {
      const r = distanceBetween(this.center, point);
      this._result = createRegularPolygon(this.center, r, this.sides);
      this._finished = true;
    }
  }

  onMouseMove(point) {
    if (this.center) {
      const r = distanceBetween(this.center, point);
      const poly = createRegularPolygon(this.center, r, this.sides);
      poly.color = '#58a6ff';
      poly.lineWidth = 0.5;
      poly.id = '__preview_polygon__';
      this._preview = [poly];
    }
  }

  onKeyDown(key, value) {
    if (key === 'Enter' && value) {
      const n = parseInt(value);
      if (n >= 3 && n <= 64) {
        this.sides = n;
        this._hint = `Specify radius (${this.sides} sides):`;
      }
    } else if (key === 'Escape') {
      this.reset();
    }
  }

  reset() {
    super.reset();
    this.center = null;
    this.sides = 6;
    this._hint = 'Specify center point:';
  }
}

function createRegularPolygon(center, radius, sides) {
  const points = [];
  for (let i = 0; i < sides; i++) {
    const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
    points.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    });
  }
  return new Polygon(points);
}

// ─── TEXT TOOL ──────────────────────────────────────────────────
export class TextTool extends BaseTool {
  constructor() {
    super('text');
    this.position = null;
    this._hint = 'Click to place text:';
  }

  onMouseDown(point) {
    this.position = { ...point };
    this._hint = 'Type text and press Enter:';
    this._result = { type: 'text-input-request', position: this.position };
    this._finished = true;
  }

  onKeyDown(key, value) {
    if (key === 'Enter' && this.position && value) {
      this._result = new Text(this.position.x, this.position.y, value, 14);
      this._finished = true;
    } else if (key === 'Escape') {
      this.reset();
    }
  }

  reset() {
    super.reset();
    this.position = null;
    this._hint = 'Click to place text:';
  }
}

// ─── MOVE TOOL ──────────────────────────────────────────────────
export class MoveTool extends BaseTool {
  constructor() {
    super('move');
    this.basePoint = null;
    this._hint = 'Specify base point:';
  }

  onMouseDown(point) {
    if (!this.basePoint) {
      this.basePoint = { ...point };
      this._hint = 'Specify destination point:';
    } else {
      const dx = point.x - this.basePoint.x;
      const dy = point.y - this.basePoint.y;
      this._result = { type: 'move', dx, dy };
      this._finished = true;
    }
  }

  onMouseMove(point) {
    if (this.basePoint) {
      this._preview = [new Line(this.basePoint.x, this.basePoint.y, point.x, point.y, {
        color: '#3fb950', lineWidth: 0.5, id: '__move_guide__',
      })];
    }
  }

  onKeyDown(key) {
    if (key === 'Escape') this.reset();
  }

  reset() {
    super.reset();
    this.basePoint = null;
    this._hint = 'Specify base point:';
  }
}

// ─── ROTATE TOOL ────────────────────────────────────────────────
export class RotateTool extends BaseTool {
  constructor() {
    super('rotate');
    this.basePoint = null;
    this.refAngle = null;
    this._hint = 'Specify base point:';
  }

  onMouseDown(point) {
    if (!this.basePoint) {
      this.basePoint = { ...point };
      this._hint = 'Specify rotation angle (click or type degrees):';
    } else {
      const angle = angleBetween(this.basePoint, point);
      this._result = { type: 'rotate', basePoint: this.basePoint, angle };
      this._finished = true;
    }
  }

  onMouseMove(point) {
    if (this.basePoint) {
      this._preview = [new Line(this.basePoint.x, this.basePoint.y, point.x, point.y, {
        color: '#f0883e', lineWidth: 0.5, id: '__rotate_guide__',
      })];
    }
  }

  onKeyDown(key, value) {
    if (key === 'Enter' && this.basePoint && value) {
      const deg = parseFloat(value);
      if (!isNaN(deg)) {
        this._result = { type: 'rotate', basePoint: this.basePoint, angle: (deg * Math.PI) / 180 };
        this._finished = true;
      }
    } else if (key === 'Escape') {
      this.reset();
    }
  }

  reset() {
    super.reset();
    this.basePoint = null;
    this.refAngle = null;
    this._hint = 'Specify base point:';
  }
}

// ─── SCALE TOOL ─────────────────────────────────────────────────
export class ScaleTool extends BaseTool {
  constructor() {
    super('scale');
    this.basePoint = null;
    this._hint = 'Specify base point:';
  }

  onMouseDown(point) {
    if (!this.basePoint) {
      this.basePoint = { ...point };
      this._hint = 'Specify scale factor (click or type value):';
    } else {
      const d = distanceBetween(this.basePoint, point);
      const factor = d / 50;  // normalized
      this._result = { type: 'scale', basePoint: this.basePoint, factor: Math.max(0.01, factor) };
      this._finished = true;
    }
  }

  onMouseMove(point) {
    if (this.basePoint) {
      this._preview = [new Line(this.basePoint.x, this.basePoint.y, point.x, point.y, {
        color: '#d2a8ff', lineWidth: 0.5, id: '__scale_guide__',
      })];
    }
  }

  onKeyDown(key, value) {
    if (key === 'Enter' && this.basePoint && value) {
      const f = parseFloat(value);
      if (!isNaN(f) && f > 0) {
        this._result = { type: 'scale', basePoint: this.basePoint, factor: f };
        this._finished = true;
      }
    } else if (key === 'Escape') {
      this.reset();
    }
  }

  reset() {
    super.reset();
    this.basePoint = null;
    this._hint = 'Specify base point:';
  }
}

// ─── MIRROR TOOL ────────────────────────────────────────────────
export class MirrorTool extends BaseTool {
  constructor() {
    super('mirror');
    this.p1 = null;
    this._hint = 'Specify first point of mirror line:';
  }

  onMouseDown(point) {
    if (!this.p1) {
      this.p1 = { ...point };
      this._hint = 'Specify second point of mirror line:';
    } else {
      this._result = { type: 'mirror', p1: this.p1, p2: { ...point } };
      this._finished = true;
    }
  }

  onMouseMove(point) {
    if (this.p1) {
      this._preview = [new Line(this.p1.x, this.p1.y, point.x, point.y, {
        color: '#ff7b72', lineWidth: 0.5, id: '__mirror_line__',
      })];
    }
  }

  onKeyDown(key) {
    if (key === 'Escape') this.reset();
  }

  reset() {
    super.reset();
    this.p1 = null;
    this._hint = 'Specify first point of mirror line:';
  }
}

// ─── MODIFY TOOL STUBS ─────────────────────────────────────────
// These provide UI hints and basic interaction; full modify logic is in store

export class TrimTool extends BaseTool {
  constructor() { super('trim'); this._hint = 'Select entity to trim:'; }
  onMouseDown(point) {
    this._result = { type: 'trim', point: { ...point } };
    this._finished = true;
  }
  reset() { super.reset(); this._hint = 'Select entity to trim:'; }
}

export class ExtendTool extends BaseTool {
  constructor() { super('extend'); this._hint = 'Select entity to extend:'; }
  onMouseDown(point) {
    this._result = { type: 'extend', point: { ...point } };
    this._finished = true;
  }
  reset() { super.reset(); this._hint = 'Select entity to extend:'; }
}

export class OffsetTool extends BaseTool {
  constructor() { super('offset'); this.distance = null; this._hint = 'Specify offset distance:'; }
  onMouseDown(point) {
    this._result = { type: 'offset', point: { ...point }, distance: this.distance || 10 };
    this._finished = true;
  }
  onKeyDown(key, value) {
    if (key === 'Enter' && value) {
      const d = parseFloat(value);
      if (!isNaN(d)) { this.distance = d; this._hint = 'Select entity to offset:'; }
    } else if (key === 'Escape') this.reset();
  }
  reset() { super.reset(); this.distance = null; this._hint = 'Specify offset distance:'; }
}

export class FilletTool extends BaseTool {
  constructor() { super('fillet'); this.radius = 5; this._hint = 'Select first entity (radius=5):'; }
  onMouseDown(point) {
    this._result = { type: 'fillet', point: { ...point }, radius: this.radius };
    this._finished = true;
  }
  onKeyDown(key, value) {
    if (key === 'Enter' && value) {
      const r = parseFloat(value);
      if (!isNaN(r) && r >= 0) { this.radius = r; this._hint = `Select first entity (radius=${r}):`; }
    } else if (key === 'Escape') this.reset();
  }
  reset() { super.reset(); this.radius = 5; this._hint = 'Select first entity (radius=5):'; }
}

export class ChamferTool extends BaseTool {
  constructor() { super('chamfer'); this.dist = 5; this._hint = 'Select first entity (dist=5):'; }
  onMouseDown(point) {
    this._result = { type: 'chamfer', point: { ...point }, dist: this.dist };
    this._finished = true;
  }
  onKeyDown(key, value) {
    if (key === 'Enter' && value) {
      const d = parseFloat(value);
      if (!isNaN(d) && d >= 0) { this.dist = d; this._hint = `Select first entity (dist=${d}):`; }
    } else if (key === 'Escape') this.reset();
  }
  reset() { super.reset(); this.dist = 5; this._hint = 'Select first entity (dist=5):'; }
}

export class ArrayTool extends BaseTool {
  constructor() { super('array'); this._hint = 'Select entities, then specify array params:'; }
  onMouseDown(point) {
    this._result = { type: 'array', point: { ...point } };
    this._finished = true;
  }
  reset() { super.reset(); this._hint = 'Select entities, then specify array params:'; }
}

export class ExplodeTool extends BaseTool {
  constructor() { super('explode'); this._hint = 'Select entity to explode:'; }
  onMouseDown(point) {
    this._result = { type: 'explode', point: { ...point } };
    this._finished = true;
  }
  reset() { super.reset(); this._hint = 'Select entity to explode:'; }
}

// ─── DIMENSION TOOL STUBS ───────────────────────────────────────
export class LinearDimensionTool extends BaseTool {
  constructor() { super('dim_linear'); this.p1 = null; this.p2 = null; this._hint = 'Specify first point:'; }
  onMouseDown(point) {
    if (!this.p1) { this.p1 = { ...point }; this._hint = 'Specify second point:'; }
    else if (!this.p2) { this.p2 = { ...point }; this._hint = 'Specify dimension line location:'; }
    else {
      this._result = { type: 'dim_linear', p1: this.p1, p2: this.p2, offset: point };
      this._finished = true;
    }
  }
  onMouseMove(point) {
    if (this.p1 && !this.p2) {
      this._preview = [new Line(this.p1.x, this.p1.y, point.x, point.y, { color: '#3fb950', lineWidth: 0.5, id: '__dim_prev__' })];
    }
  }
  reset() { super.reset(); this.p1 = null; this.p2 = null; this._hint = 'Specify first point:'; }
}

export class AlignedDimensionTool extends BaseTool {
  constructor() { super('dim_aligned'); this.p1 = null; this.p2 = null; this._hint = 'Specify first point:'; }
  onMouseDown(point) {
    if (!this.p1) { this.p1 = { ...point }; this._hint = 'Specify second point:'; }
    else if (!this.p2) { this.p2 = { ...point }; this._hint = 'Specify dimension line location:'; }
    else {
      this._result = { type: 'dim_aligned', p1: this.p1, p2: this.p2, offset: point };
      this._finished = true;
    }
  }
  reset() { super.reset(); this.p1 = null; this.p2 = null; this._hint = 'Specify first point:'; }
}

export class RadiusDimensionTool extends BaseTool {
  constructor() { super('dim_radius'); this._hint = 'Select arc or circle:'; }
  onMouseDown(point) {
    this._result = { type: 'dim_radius', point: { ...point } };
    this._finished = true;
  }
  reset() { super.reset(); this._hint = 'Select arc or circle:'; }
}

export class DiameterDimensionTool extends BaseTool {
  constructor() { super('dim_diameter'); this._hint = 'Select arc or circle:'; }
  onMouseDown(point) {
    this._result = { type: 'dim_diameter', point: { ...point } };
    this._finished = true;
  }
  reset() { super.reset(); this._hint = 'Select arc or circle:'; }
}

export class AngleDimensionTool extends BaseTool {
  constructor() { super('dim_angle'); this.p1 = null; this.p2 = null; this._hint = 'Specify vertex:'; }
  onMouseDown(point) {
    if (!this.p1) { this.p1 = { ...point }; this._hint = 'Specify first ray endpoint:'; }
    else if (!this.p2) { this.p2 = { ...point }; this._hint = 'Specify second ray endpoint:'; }
    else {
      this._result = { type: 'dim_angle', center: this.p1, p1: this.p2, p2: { ...point } };
      this._finished = true;
    }
  }
  reset() { super.reset(); this.p1 = null; this.p2 = null; this._hint = 'Specify vertex:'; }
}

// ─── ANNOTATION TOOL STUBS ──────────────────────────────────────
export class LeaderTool extends BaseTool {
  constructor() { super('leader'); this.points = []; this._hint = 'Specify leader start:'; }
  onMouseDown(point) {
    this.points.push({ ...point });
    this._hint = `Point ${this.points.length} added. Enter to finish:`;
  }
  onKeyDown(key, value) {
    if (key === 'Enter' && this.points.length >= 2) {
      this._result = { type: 'leader', points: this.points, text: value || '' };
      this._finished = true;
    } else if (key === 'Escape') this.reset();
  }
  reset() { super.reset(); this.points = []; this._hint = 'Specify leader start:'; }
}

export class CenterlineTool extends BaseTool {
  constructor() { super('centerline'); this.p1 = null; this._hint = 'Specify first point:'; }
  onMouseDown(point) {
    if (!this.p1) { this.p1 = { ...point }; this._hint = 'Specify second point:'; }
    else {
      this._result = new Line(this.p1.x, this.p1.y, point.x, point.y, { color: '#ff7b72', lineWidth: 0.5 });
      this._result.lineType = 'center';
      this._finished = true;
    }
  }
  reset() { super.reset(); this.p1 = null; this._hint = 'Specify first point:'; }
}

export class HatchTool extends BaseTool {
  constructor() { super('hatch'); this._hint = 'Select closed boundary entity:'; }
  onMouseDown(point) {
    this._result = { type: 'hatch', point: { ...point } };
    this._finished = true;
  }
  reset() { super.reset(); this._hint = 'Select closed boundary entity:'; }
}

// ─── TOOL FACTORY ───────────────────────────────────────────────
export const TOOL_MAP = {
  select: SelectTool,
  move: MoveTool,
  rotate: RotateTool,
  scale: ScaleTool,
  mirror: MirrorTool,
  line: LineTool,
  polyline: PolylineTool,
  rectangle: RectangleTool,
  circle: CircleTool,
  arc: ArcTool,
  polygon: PolygonTool,
  text: TextTool,
  trim: TrimTool,
  extend: ExtendTool,
  offset: OffsetTool,
  fillet: FilletTool,
  chamfer: ChamferTool,
  array: ArrayTool,
  explode: ExplodeTool,
  dim_linear: LinearDimensionTool,
  dim_aligned: AlignedDimensionTool,
  dim_radius: RadiusDimensionTool,
  dim_diameter: DiameterDimensionTool,
  dim_angle: AngleDimensionTool,
  leader: LeaderTool,
  centerline: CenterlineTool,
  hatch: HatchTool,
};

export function createTool(name) {
  const ToolClass = TOOL_MAP[name];
  if (!ToolClass) return new SelectTool();
  return new ToolClass();
}
