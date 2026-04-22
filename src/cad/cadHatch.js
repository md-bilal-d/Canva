// cadHatch.js — Hatch fill rendering engine

import { generateId } from './cadGeometry.js';

export class HatchFill {
  constructor(boundary, pattern = 'lines', angle = 45, scale = 1, props = {}) {
    this.type = 'hatch';
    this.id = props.id || generateId();
    this.layer = props.layer || '0';
    this.color = props.color || '#e6edf3';
    this.boundary = boundary; // [{x,y}, ...] — closed polygon
    this.pattern = pattern;   // 'solid' | 'lines' | 'cross' | 'dots'
    this.angle = angle;       // degrees
    this.scale = scale;       // pattern scale multiplier
    this.opacity = props.opacity ?? 0.3;
  }

  render(ctx, viewState) {
    if (!this.boundary || this.boundary.length < 3) return;

    const { zoom, panX, panY } = viewState;
    const toScreen = (x, y) => ({
      sx: x * zoom + panX,
      sy: -y * zoom + panY,
    });

    const screenPts = this.boundary.map(p => toScreen(p.x, p.y));

    ctx.save();
    ctx.globalAlpha = this.opacity;

    // Create clip region from boundary
    ctx.beginPath();
    ctx.moveTo(screenPts[0].sx, screenPts[0].sy);
    for (let i = 1; i < screenPts.length; i++) {
      ctx.lineTo(screenPts[i].sx, screenPts[i].sy);
    }
    ctx.closePath();
    ctx.clip();

    // Get bounding box of screen points
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of screenPts) {
      if (p.sx < minX) minX = p.sx;
      if (p.sy < minY) minY = p.sy;
      if (p.sx > maxX) maxX = p.sx;
      if (p.sy > maxY) maxY = p.sy;
    }

    const spacing = 8 * this.scale * zoom;
    const rad = (this.angle * Math.PI) / 180;

    switch (this.pattern) {
      case 'solid':
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(screenPts[0].sx, screenPts[0].sy);
        for (let i = 1; i < screenPts.length; i++) {
          ctx.lineTo(screenPts[i].sx, screenPts[i].sy);
        }
        ctx.closePath();
        ctx.fill();
        break;

      case 'lines':
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 0.6;
        drawHatchLines(ctx, minX, minY, maxX, maxY, spacing, rad);
        break;

      case 'cross':
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 0.6;
        drawHatchLines(ctx, minX, minY, maxX, maxY, spacing, rad);
        drawHatchLines(ctx, minX, minY, maxX, maxY, spacing, rad + Math.PI / 2);
        break;

      case 'dots':
        ctx.fillStyle = this.color;
        drawHatchDots(ctx, minX, minY, maxX, maxY, spacing);
        break;
    }

    ctx.restore();
  }
}

function drawHatchLines(ctx, minX, minY, maxX, maxY, spacing, angle) {
  const w = maxX - minX;
  const h = maxY - minY;
  const diag = Math.sqrt(w * w + h * h);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const count = Math.ceil(diag / Math.max(spacing, 1));

  ctx.beginPath();
  for (let i = -count; i <= count; i++) {
    const offset = i * spacing;
    // Perpendicular offset
    const ox = -sin * offset;
    const oy = cos * offset;
    // Line along angle direction
    const lx = cos * diag;
    const ly = sin * diag;

    ctx.moveTo(cx + ox - lx, cy + oy - ly);
    ctx.lineTo(cx + ox + lx, cy + oy + ly);
  }
  ctx.stroke();
}

function drawHatchDots(ctx, minX, minY, maxX, maxY, spacing) {
  for (let x = minX; x <= maxX; x += spacing) {
    for (let y = minY; y <= maxY; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
