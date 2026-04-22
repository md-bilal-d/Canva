// cadDimensions.js — Dimension & Annotation rendering engine

import { Line, Text, Arc, distanceBetween, angleBetween, generateId } from './cadGeometry.js';

// ─── DEFAULT DIM STYLE ──────────────────────────────────────────
export const DEFAULT_DIM_STYLE = {
  arrowSize: 4,
  textHeight: 3.5,
  gap: 1.5,
  extensionOvershoot: 2,
  color: '#3fb950',
  font: '12px "JetBrains Mono", monospace',
};

// ─── HELPER: draw arrowhead ─────────────────────────────────────
function drawArrow(ctx, x, y, angle, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size * 3, -size);
  ctx.lineTo(-size * 3, size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ─── UNIT CONVERSION ────────────────────────────────────────────
function formatMeasurement(value, units = 'mm', precision = 2) {
  const suffix = units === 'inch' ? '"' : units === 'cm' ? 'cm' : 'mm';
  return value.toFixed(precision) + (units !== 'mm' ? ' ' + suffix : '');
}

// ─── LINEAR DIMENSION ───────────────────────────────────────────
export class LinearDimension {
  constructor(p1, p2, offset = 20, text = null, props = {}) {
    this.type = 'dim_linear';
    this.id = props.id || generateId();
    this.layer = props.layer || 'Dimensions';
    this.color = props.color || DEFAULT_DIM_STYLE.color;
    this.p1 = p1;
    this.p2 = p2;
    this.offset = offset;
    this.customText = text;
  }

  getText(units = 'mm', precision = 2) {
    if (this.customText) return this.customText;
    // Auto-detect horizontal or vertical
    const dx = Math.abs(this.p2.x - this.p1.x);
    const dy = Math.abs(this.p2.y - this.p1.y);
    const dist = dx > dy ? dx : dy;
    return formatMeasurement(dist, units, precision);
  }

  render(ctx, viewState, dimStyle = DEFAULT_DIM_STYLE, units = 'mm', precision = 2) {
    const { zoom, panX, panY } = viewState;
    const toScreen = (x, y) => ({
      sx: x * zoom + panX,
      sy: -y * zoom + panY,
    });

    const dx = Math.abs(this.p2.x - this.p1.x);
    const dy = Math.abs(this.p2.y - this.p1.y);
    const isHorizontal = dx >= dy;

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    ctx.lineWidth = 0.8;
    ctx.font = dimStyle.font;

    let dimLineY, dimLineX;
    if (isHorizontal) {
      dimLineY = Math.max(this.p1.y, this.p2.y) + this.offset;
      const s1 = toScreen(this.p1.x, this.p1.y);
      const s2 = toScreen(this.p2.x, this.p2.y);
      const sd1 = toScreen(this.p1.x, dimLineY);
      const sd2 = toScreen(this.p2.x, dimLineY);

      // Extension lines
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(s1.sx, s1.sy);
      ctx.lineTo(sd1.sx, sd1.sy - dimStyle.extensionOvershoot * zoom);
      ctx.moveTo(s2.sx, s2.sy);
      ctx.lineTo(sd2.sx, sd2.sy - dimStyle.extensionOvershoot * zoom);
      ctx.stroke();

      // Dimension line
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(sd1.sx, sd1.sy);
      ctx.lineTo(sd2.sx, sd2.sy);
      ctx.stroke();

      // Arrows
      drawArrow(ctx, sd1.sx, sd1.sy, 0, dimStyle.arrowSize);
      drawArrow(ctx, sd2.sx, sd2.sy, Math.PI, dimStyle.arrowSize);

      // Text
      const text = this.getText(units, precision);
      const midX = (sd1.sx + sd2.sx) / 2;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(text, midX, sd1.sy - dimStyle.gap);
    } else {
      dimLineX = Math.max(this.p1.x, this.p2.x) + this.offset;
      const s1 = toScreen(this.p1.x, this.p1.y);
      const s2 = toScreen(this.p2.x, this.p2.y);
      const sd1 = toScreen(dimLineX, this.p1.y);
      const sd2 = toScreen(dimLineX, this.p2.y);

      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(s1.sx, s1.sy);
      ctx.lineTo(sd1.sx + dimStyle.extensionOvershoot * zoom, sd1.sy);
      ctx.moveTo(s2.sx, s2.sy);
      ctx.lineTo(sd2.sx + dimStyle.extensionOvershoot * zoom, sd2.sy);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(sd1.sx, sd1.sy);
      ctx.lineTo(sd2.sx, sd2.sy);
      ctx.stroke();

      drawArrow(ctx, sd1.sx, sd1.sy, -Math.PI / 2, dimStyle.arrowSize);
      drawArrow(ctx, sd2.sx, sd2.sy, Math.PI / 2, dimStyle.arrowSize);

      const text = this.getText(units, precision);
      const midY = (sd1.sy + sd2.sy) / 2;
      ctx.save();
      ctx.translate(sd1.sx + dimStyle.gap + 10, midY);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }

  getEntities() {
    return [
      new Line(this.p1.x, this.p1.y, this.p2.x, this.p2.y, {
        layer: this.layer, color: this.color, lineWidth: 0.5,
      }),
    ];
  }
}

// ─── ALIGNED DIMENSION ──────────────────────────────────────────
export class AlignedDimension {
  constructor(p1, p2, offset = 20, text = null, props = {}) {
    this.type = 'dim_aligned';
    this.id = props.id || generateId();
    this.layer = props.layer || 'Dimensions';
    this.color = props.color || DEFAULT_DIM_STYLE.color;
    this.p1 = p1;
    this.p2 = p2;
    this.offset = offset;
    this.customText = text;
  }

  getText(units = 'mm', precision = 2) {
    if (this.customText) return this.customText;
    return formatMeasurement(distanceBetween(this.p1, this.p2), units, precision);
  }

  render(ctx, viewState, dimStyle = DEFAULT_DIM_STYLE, units = 'mm', precision = 2) {
    const { zoom, panX, panY } = viewState;
    const toScreen = (x, y) => ({
      sx: x * zoom + panX,
      sy: -y * zoom + panY,
    });

    const angle = angleBetween(this.p1, this.p2);
    const perpAngle = angle + Math.PI / 2;
    const ox = this.offset * Math.cos(perpAngle);
    const oy = this.offset * Math.sin(perpAngle);

    const d1 = { x: this.p1.x + ox, y: this.p1.y + oy };
    const d2 = { x: this.p2.x + ox, y: this.p2.y + oy };

    const s1 = toScreen(this.p1.x, this.p1.y);
    const s2 = toScreen(this.p2.x, this.p2.y);
    const sd1 = toScreen(d1.x, d1.y);
    const sd2 = toScreen(d2.x, d2.y);

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    ctx.lineWidth = 0.8;
    ctx.font = dimStyle.font;

    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(s1.sx, s1.sy);
    ctx.lineTo(sd1.sx, sd1.sy);
    ctx.moveTo(s2.sx, s2.sy);
    ctx.lineTo(sd2.sx, sd2.sy);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(sd1.sx, sd1.sy);
    ctx.lineTo(sd2.sx, sd2.sy);
    ctx.stroke();

    const screenAngle = Math.atan2(sd2.sy - sd1.sy, sd2.sx - sd1.sx);
    drawArrow(ctx, sd1.sx, sd1.sy, screenAngle, dimStyle.arrowSize);
    drawArrow(ctx, sd2.sx, sd2.sy, screenAngle + Math.PI, dimStyle.arrowSize);

    const text = this.getText(units, precision);
    const midX = (sd1.sx + sd2.sx) / 2;
    const midY = (sd1.sy + sd2.sy) / 2;
    ctx.save();
    ctx.translate(midX, midY);
    let textAngle = screenAngle;
    if (textAngle > Math.PI / 2 || textAngle < -Math.PI / 2) textAngle += Math.PI;
    ctx.rotate(textAngle);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(text, 0, -dimStyle.gap);
    ctx.restore();

    ctx.restore();
  }

  getEntities() {
    return [new Line(this.p1.x, this.p1.y, this.p2.x, this.p2.y, {
      layer: this.layer, color: this.color, lineWidth: 0.5,
    })];
  }
}

// ─── RADIUS DIMENSION ───────────────────────────────────────────
export class RadiusDimension {
  constructor(cx, cy, radius, angle = 0, text = null, props = {}) {
    this.type = 'dim_radius';
    this.id = props.id || generateId();
    this.layer = props.layer || 'Dimensions';
    this.color = props.color || DEFAULT_DIM_STYLE.color;
    this.cx = cx;
    this.cy = cy;
    this.radius = radius;
    this.angle = angle;
    this.customText = text;
  }

  getText(units = 'mm', precision = 2) {
    if (this.customText) return this.customText;
    return 'R' + formatMeasurement(this.radius, units, precision);
  }

  render(ctx, viewState, dimStyle = DEFAULT_DIM_STYLE, units = 'mm', precision = 2) {
    const { zoom, panX, panY } = viewState;
    const toScreen = (x, y) => ({ sx: x * zoom + panX, sy: -y * zoom + panY });

    const ex = this.cx + this.radius * Math.cos(this.angle);
    const ey = this.cy + this.radius * Math.sin(this.angle);
    const sc = toScreen(this.cx, this.cy);
    const se = toScreen(ex, ey);

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    ctx.lineWidth = 0.8;
    ctx.font = dimStyle.font;

    ctx.beginPath();
    ctx.moveTo(sc.sx, sc.sy);
    ctx.lineTo(se.sx, se.sy);
    ctx.stroke();

    const screenAngle = Math.atan2(se.sy - sc.sy, se.sx - sc.sx);
    drawArrow(ctx, se.sx, se.sy, screenAngle, dimStyle.arrowSize);

    const text = this.getText(units, precision);
    const midX = (sc.sx + se.sx) / 2;
    const midY = (sc.sy + se.sy) / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(text, midX, midY - dimStyle.gap);

    ctx.restore();
  }

  getEntities() {
    return [];
  }
}

// ─── DIAMETER DIMENSION ─────────────────────────────────────────
export class DiameterDimension {
  constructor(cx, cy, radius, angle = 0, text = null, props = {}) {
    this.type = 'dim_diameter';
    this.id = props.id || generateId();
    this.layer = props.layer || 'Dimensions';
    this.color = props.color || DEFAULT_DIM_STYLE.color;
    this.cx = cx;
    this.cy = cy;
    this.radius = radius;
    this.angle = angle;
    this.customText = text;
  }

  getText(units = 'mm', precision = 2) {
    if (this.customText) return this.customText;
    return '⌀' + formatMeasurement(this.radius * 2, units, precision);
  }

  render(ctx, viewState, dimStyle = DEFAULT_DIM_STYLE, units = 'mm', precision = 2) {
    const { zoom, panX, panY } = viewState;
    const toScreen = (x, y) => ({ sx: x * zoom + panX, sy: -y * zoom + panY });

    const ex1 = this.cx + this.radius * Math.cos(this.angle);
    const ey1 = this.cy + this.radius * Math.sin(this.angle);
    const ex2 = this.cx - this.radius * Math.cos(this.angle);
    const ey2 = this.cy - this.radius * Math.sin(this.angle);
    const se1 = toScreen(ex1, ey1);
    const se2 = toScreen(ex2, ey2);

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    ctx.lineWidth = 0.8;
    ctx.font = dimStyle.font;

    ctx.beginPath();
    ctx.moveTo(se1.sx, se1.sy);
    ctx.lineTo(se2.sx, se2.sy);
    ctx.stroke();

    const ang = Math.atan2(se1.sy - se2.sy, se1.sx - se2.sx);
    drawArrow(ctx, se1.sx, se1.sy, ang, dimStyle.arrowSize);
    drawArrow(ctx, se2.sx, se2.sy, ang + Math.PI, dimStyle.arrowSize);

    const text = this.getText(units, precision);
    const midX = (se1.sx + se2.sx) / 2;
    const midY = (se1.sy + se2.sy) / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(text, midX, midY - dimStyle.gap);

    ctx.restore();
  }

  getEntities() { return []; }
}

// ─── ANGLE DIMENSION ────────────────────────────────────────────
export class AngleDimension {
  constructor(center, p1, p2, radius = 30, text = null, props = {}) {
    this.type = 'dim_angle';
    this.id = props.id || generateId();
    this.layer = props.layer || 'Dimensions';
    this.color = props.color || DEFAULT_DIM_STYLE.color;
    this.center = center;
    this.p1 = p1;
    this.p2 = p2;
    this.radius = radius;
    this.customText = text;
  }

  getText() {
    if (this.customText) return this.customText;
    let a1 = angleBetween(this.center, this.p1);
    let a2 = angleBetween(this.center, this.p2);
    let diff = ((a2 - a1) * 180) / Math.PI;
    if (diff < 0) diff += 360;
    return diff.toFixed(1) + '°';
  }

  render(ctx, viewState, dimStyle = DEFAULT_DIM_STYLE) {
    const { zoom, panX, panY } = viewState;
    const toScreen = (x, y) => ({ sx: x * zoom + panX, sy: -y * zoom + panY });

    const a1 = angleBetween(this.center, this.p1);
    const a2 = angleBetween(this.center, this.p2);
    const sc = toScreen(this.center.x, this.center.y);
    const r = this.radius * zoom;

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    ctx.lineWidth = 0.8;
    ctx.font = dimStyle.font;

    ctx.beginPath();
    ctx.arc(sc.sx, sc.sy, r, -a2, -a1); // Y-flip angles
    ctx.stroke();

    const text = this.getText();
    const midAngle = -(a1 + a2) / 2;
    const tx = sc.sx + (r + 10) * Math.cos(midAngle);
    const ty = sc.sy + (r + 10) * Math.sin(midAngle);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, tx, ty);

    ctx.restore();
  }

  getEntities() { return []; }
}

// ─── LEADER ─────────────────────────────────────────────────────
export class Leader {
  constructor(points, text = '', props = {}) {
    this.type = 'leader';
    this.id = props.id || generateId();
    this.layer = props.layer || 'Annotations';
    this.color = props.color || '#d29922';
    this.points = points; // [{x,y}, ...]
    this.text = text;
  }

  render(ctx, viewState, dimStyle = DEFAULT_DIM_STYLE) {
    if (this.points.length < 2) return;
    const { zoom, panX, panY } = viewState;
    const toScreen = (x, y) => ({ sx: x * zoom + panX, sy: -y * zoom + panY });

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    ctx.lineWidth = 0.8;
    ctx.font = dimStyle.font;

    // Draw leader line segments
    const screenPts = this.points.map(p => toScreen(p.x, p.y));
    ctx.beginPath();
    ctx.moveTo(screenPts[0].sx, screenPts[0].sy);
    for (let i = 1; i < screenPts.length; i++) {
      ctx.lineTo(screenPts[i].sx, screenPts[i].sy);
    }
    ctx.stroke();

    // Arrow at first point
    if (screenPts.length >= 2) {
      const ang = Math.atan2(
        screenPts[0].sy - screenPts[1].sy,
        screenPts[0].sx - screenPts[1].sx
      );
      drawArrow(ctx, screenPts[0].sx, screenPts[0].sy, ang + Math.PI, dimStyle.arrowSize);
    }

    // Text at last point
    if (this.text) {
      const last = screenPts[screenPts.length - 1];
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(this.text, last.sx + 4, last.sy - 2);
    }

    ctx.restore();
  }

  getEntities() {
    return this.points.length >= 2
      ? [new Line(this.points[0].x, this.points[0].y,
                   this.points[this.points.length - 1].x,
                   this.points[this.points.length - 1].y,
                   { layer: this.layer, color: this.color })]
      : [];
  }
}
