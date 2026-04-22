// cadDXF.js — DXF Import/Export + SVG Export
// Supports DXF R2010 compatible format

import { Line, Circle, Arc, Polyline, Text, generateId } from './cadGeometry.js';

// ─── ACI COLOR TABLE (subset) ───────────────────────────────────
const ACI_COLORS = {
  0: '#000000', 1: '#ff0000', 2: '#ffff00', 3: '#00ff00',
  4: '#00ffff', 5: '#0000ff', 6: '#ff00ff', 7: '#ffffff',
  8: '#808080', 9: '#c0c0c0', 10: '#ff0000', 11: '#ff7f7f',
  30: '#ff7f00', 40: '#ff7f00', 50: '#ffff00', 70: '#00ff00',
  90: '#00ff7f', 110: '#00ffff', 130: '#007fff', 150: '#0000ff',
  170: '#7f00ff', 190: '#ff00ff', 210: '#ff007f',
};

function aciToHex(code) {
  return ACI_COLORS[code] || '#e6edf3';
}

function hexToAci(hex) {
  hex = hex.toLowerCase();
  for (const [code, color] of Object.entries(ACI_COLORS)) {
    if (color === hex) return parseInt(code);
  }
  return 7; // default white
}

// ─── PARSE DXF ──────────────────────────────────────────────────

export function parseDXF(dxfString) {
  const entities = [];
  const layerSet = new Map();
  const lines = dxfString.split(/\r?\n/);
  let i = 0;

  // Helper: read group code / value pairs
  function nextPair() {
    if (i >= lines.length - 1) return null;
    const code = parseInt(lines[i].trim());
    const value = lines[i + 1].trim();
    i += 2;
    return { code, value };
  }

  // Find ENTITIES section
  while (i < lines.length) {
    const pair = nextPair();
    if (!pair) break;
    if (pair.code === 2 && pair.value === 'ENTITIES') break;
  }

  // Parse entities
  let currentType = null;
  let props = {};

  function flushEntity() {
    if (!currentType) return;
    const id = generateId();
    const layer = props.layer || '0';
    const color = props.color ? aciToHex(parseInt(props.color)) : '#e6edf3';
    const lineWidth = props.lineWidth ? parseFloat(props.lineWidth) : 1;

    if (!layerSet.has(layer)) {
      layerSet.set(layer, { name: layer, color, visible: true, locked: false, lineType: 'continuous' });
    }

    const common = { id, layer, color, lineWidth };

    switch (currentType) {
      case 'LINE':
        if (props.x1 != null && props.y1 != null && props.x2 != null && props.y2 != null) {
          entities.push(new Line(
            parseFloat(props.x1), parseFloat(props.y1),
            parseFloat(props.x2), parseFloat(props.y2), common
          ));
        }
        break;
      case 'CIRCLE':
        if (props.cx != null && props.cy != null && props.radius != null) {
          entities.push(new Circle(
            parseFloat(props.cx), parseFloat(props.cy),
            parseFloat(props.radius), common
          ));
        }
        break;
      case 'ARC':
        if (props.cx != null && props.cy != null && props.radius != null) {
          entities.push(new Arc(
            parseFloat(props.cx), parseFloat(props.cy),
            parseFloat(props.radius),
            (parseFloat(props.startAngle || 0) * Math.PI) / 180,
            (parseFloat(props.endAngle || 360) * Math.PI) / 180,
            common
          ));
        }
        break;
      case 'LWPOLYLINE':
      case 'POLYLINE':
        if (props.vertices && props.vertices.length >= 2) {
          entities.push(new Polyline(props.vertices, common));
        }
        break;
      case 'TEXT':
      case 'MTEXT':
        if (props.tx != null && props.ty != null && props.textValue) {
          entities.push(new Text(
            parseFloat(props.tx), parseFloat(props.ty),
            props.textValue, parseFloat(props.textHeight || 12), 0, common
          ));
        }
        break;
      case 'INSERT':
        // Block reference — stub
        console.log('INSERT (block) encountered — stub, skipping.');
        break;
    }
    currentType = null;
    props = {};
  }

  while (i < lines.length) {
    const pair = nextPair();
    if (!pair) break;

    if (pair.code === 0) {
      flushEntity();
      if (pair.value === 'ENDSEC' || pair.value === 'EOF') break;
      if (['LINE', 'CIRCLE', 'ARC', 'LWPOLYLINE', 'POLYLINE', 'TEXT', 'MTEXT', 'INSERT'].includes(pair.value)) {
        currentType = pair.value;
        props = {};
        if (pair.value === 'LWPOLYLINE' || pair.value === 'POLYLINE') {
          props.vertices = [];
        }
      }
    } else if (currentType) {
      // Map group codes to props
      switch (pair.code) {
        case 8: props.layer = pair.value; break;
        case 62: props.color = pair.value; break;
        case 370: props.lineWidth = pair.value; break;

        // LINE
        case 10:
          if (currentType === 'LINE') props.x1 = pair.value;
          else if (currentType === 'CIRCLE' || currentType === 'ARC') props.cx = pair.value;
          else if (currentType === 'TEXT' || currentType === 'MTEXT') props.tx = pair.value;
          else if (currentType === 'LWPOLYLINE' || currentType === 'POLYLINE') {
            props._curX = parseFloat(pair.value);
          }
          break;
        case 20:
          if (currentType === 'LINE') props.y1 = pair.value;
          else if (currentType === 'CIRCLE' || currentType === 'ARC') props.cy = pair.value;
          else if (currentType === 'TEXT' || currentType === 'MTEXT') props.ty = pair.value;
          else if (currentType === 'LWPOLYLINE' || currentType === 'POLYLINE') {
            if (props._curX != null) {
              props.vertices.push({ x: props._curX, y: parseFloat(pair.value) });
              props._curX = null;
            }
          }
          break;
        case 11:
          if (currentType === 'LINE') props.x2 = pair.value;
          break;
        case 21:
          if (currentType === 'LINE') props.y2 = pair.value;
          break;
        case 40:
          if (currentType === 'CIRCLE' || currentType === 'ARC') props.radius = pair.value;
          else if (currentType === 'TEXT' || currentType === 'MTEXT') props.textHeight = pair.value;
          break;
        case 50:
          if (currentType === 'ARC') props.startAngle = pair.value;
          break;
        case 51:
          if (currentType === 'ARC') props.endAngle = pair.value;
          break;
        case 1:
          if (currentType === 'TEXT' || currentType === 'MTEXT') props.textValue = pair.value;
          break;
      }
    }
  }
  flushEntity();

  return {
    entities,
    layers: [...layerSet.values()],
  };
}

// ─── GENERATE DXF ───────────────────────────────────────────────

export function generateDXF(entities, layers = []) {
  const out = [];

  function gc(code, value) {
    out.push(`  ${code}`);
    out.push(`${value}`);
  }

  // HEADER
  gc(0, 'SECTION');
  gc(2, 'HEADER');
  gc(9, '$ACADVER');
  gc(1, 'AC1024'); // R2010
  gc(9, '$INSBASE');
  gc(10, '0.0'); gc(20, '0.0'); gc(30, '0.0');
  gc(9, '$EXTMIN');
  gc(10, '0.0'); gc(20, '0.0'); gc(30, '0.0');
  gc(9, '$EXTMAX');
  gc(10, '1000.0'); gc(20, '1000.0'); gc(30, '0.0');
  gc(0, 'ENDSEC');

  // TABLES — LAYER
  gc(0, 'SECTION');
  gc(2, 'TABLES');
  gc(0, 'TABLE');
  gc(2, 'LAYER');
  gc(70, layers.length || 1);

  const layerArr = layers.length > 0 ? layers : [{ name: '0', color: '#ffffff' }];
  for (const layer of layerArr) {
    gc(0, 'LAYER');
    gc(2, layer.name);
    gc(70, 0);
    gc(62, hexToAci(layer.color || '#ffffff'));
    gc(6, layer.lineType === 'dashed' ? 'DASHED' : 'CONTINUOUS');
  }
  gc(0, 'ENDTAB');
  gc(0, 'ENDSEC');

  // ENTITIES
  gc(0, 'SECTION');
  gc(2, 'ENTITIES');

  const entArr = entities instanceof Map ? [...entities.values()] : entities;
  for (const ent of entArr) {
    if (ent.id && ent.id.startsWith('__')) continue;

    switch (ent.type) {
      case 'line':
        gc(0, 'LINE');
        gc(8, ent.layer || '0');
        gc(62, hexToAci(ent.color));
        gc(10, ent.x1.toFixed(4));
        gc(20, ent.y1.toFixed(4));
        gc(30, '0.0');
        gc(11, ent.x2.toFixed(4));
        gc(21, ent.y2.toFixed(4));
        gc(31, '0.0');
        break;

      case 'circle':
        gc(0, 'CIRCLE');
        gc(8, ent.layer || '0');
        gc(62, hexToAci(ent.color));
        gc(10, ent.cx.toFixed(4));
        gc(20, ent.cy.toFixed(4));
        gc(30, '0.0');
        gc(40, ent.radius.toFixed(4));
        break;

      case 'arc':
        gc(0, 'ARC');
        gc(8, ent.layer || '0');
        gc(62, hexToAci(ent.color));
        gc(10, ent.cx.toFixed(4));
        gc(20, ent.cy.toFixed(4));
        gc(30, '0.0');
        gc(40, ent.radius.toFixed(4));
        gc(50, ((ent.startAngle * 180) / Math.PI).toFixed(4));
        gc(51, ((ent.endAngle * 180) / Math.PI).toFixed(4));
        break;

      case 'polyline':
      case 'polygon': {
        gc(0, 'LWPOLYLINE');
        gc(8, ent.layer || '0');
        gc(62, hexToAci(ent.color));
        const pts = ent.points || [];
        gc(90, pts.length);
        gc(70, ent.type === 'polygon' ? 1 : 0); // closed flag
        for (const p of pts) {
          gc(10, p.x.toFixed(4));
          gc(20, p.y.toFixed(4));
        }
        break;
      }

      case 'rectangle': {
        gc(0, 'LWPOLYLINE');
        gc(8, ent.layer || '0');
        gc(62, hexToAci(ent.color));
        gc(90, 4);
        gc(70, 1); // closed
        const corners = [
          { x: ent.x, y: ent.y },
          { x: ent.x + ent.width, y: ent.y },
          { x: ent.x + ent.width, y: ent.y + ent.height },
          { x: ent.x, y: ent.y + ent.height },
        ];
        for (const c of corners) {
          gc(10, c.x.toFixed(4));
          gc(20, c.y.toFixed(4));
        }
        break;
      }

      case 'text':
        gc(0, 'TEXT');
        gc(8, ent.layer || '0');
        gc(62, hexToAci(ent.color));
        gc(10, ent.x.toFixed(4));
        gc(20, ent.y.toFixed(4));
        gc(30, '0.0');
        gc(40, (ent.fontSize || 12).toFixed(4));
        gc(1, ent.text || '');
        break;
    }
  }

  gc(0, 'ENDSEC');
  gc(0, 'EOF');

  return out.join('\n');
}

// ─── SVG EXPORT ─────────────────────────────────────────────────

export function exportSVG(entities, viewBox = { x: -500, y: -500, w: 1000, h: 1000 }) {
  const svgParts = [];

  svgParts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}" width="${viewBox.w}" height="${viewBox.h}">`
  );
  svgParts.push('<rect width="100%" height="100%" fill="#0d1117"/>');

  const entArr = entities instanceof Map ? [...entities.values()] : entities;
  for (const ent of entArr) {
    if (ent.id && ent.id.startsWith('__')) continue;
    const stroke = ent.color || '#e6edf3';
    const sw = ent.lineWidth || 1;

    switch (ent.type) {
      case 'line':
        svgParts.push(
          `<line x1="${ent.x1}" y1="${-ent.y1}" x2="${ent.x2}" y2="${-ent.y2}" stroke="${stroke}" stroke-width="${sw}" />`
        );
        break;
      case 'circle':
        svgParts.push(
          `<circle cx="${ent.cx}" cy="${-ent.cy}" r="${ent.radius}" stroke="${stroke}" stroke-width="${sw}" fill="none" />`
        );
        break;
      case 'arc': {
        const sx = ent.cx + ent.radius * Math.cos(ent.startAngle);
        const sy = -(ent.cy + ent.radius * Math.sin(ent.startAngle));
        const ex = ent.cx + ent.radius * Math.cos(ent.endAngle);
        const ey = -(ent.cy + ent.radius * Math.sin(ent.endAngle));
        let sweep = ent.endAngle - ent.startAngle;
        if (sweep < 0) sweep += Math.PI * 2;
        const large = sweep > Math.PI ? 1 : 0;
        svgParts.push(
          `<path d="M ${sx} ${sy} A ${ent.radius} ${ent.radius} 0 ${large} 0 ${ex} ${ey}" stroke="${stroke}" stroke-width="${sw}" fill="none" />`
        );
        break;
      }
      case 'rectangle':
        svgParts.push(
          `<rect x="${ent.x}" y="${-(ent.y + ent.height)}" width="${ent.width}" height="${ent.height}" stroke="${stroke}" stroke-width="${sw}" fill="none" />`
        );
        break;
      case 'polyline': {
        const pts = ent.points.map(p => `${p.x},${-p.y}`).join(' ');
        svgParts.push(
          `<polyline points="${pts}" stroke="${stroke}" stroke-width="${sw}" fill="none" />`
        );
        break;
      }
      case 'polygon': {
        const pts = ent.points.map(p => `${p.x},${-p.y}`).join(' ');
        svgParts.push(
          `<polygon points="${pts}" stroke="${stroke}" stroke-width="${sw}" fill="none" />`
        );
        break;
      }
      case 'text':
        svgParts.push(
          `<text x="${ent.x}" y="${-ent.y}" fill="${stroke}" font-size="${ent.fontSize}" font-family="monospace">${ent.text}</text>`
        );
        break;
    }
  }

  svgParts.push('</svg>');
  return svgParts.join('\n');
}
