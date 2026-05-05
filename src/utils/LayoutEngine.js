/**
 * LayoutEngine.js
 * Utilities for automatically arranging shapes on the canvas.
 */

export const LAYOUT_TYPES = {
  GRID: 'grid',
  STACK_H: 'stack-h',
  STACK_V: 'stack-v',
  MIND_MAP: 'mind-map',
  SPIRAL: 'spiral',
};

/**
 * Arranges a set of shapes according to the specified layout type.
 * @param {Array} shapes - Array of shape objects to arrange.
 * @param {string} type - The layout type (GRID, STACK_H, STACK_V, CIRCLE, SPIRAL).
 * @param {number} startX - Starting X position.
 * @param {number} startY - Starting Y position.
 * @param {number} padding - Padding between shapes.
 * @returns {Array} - Array of updates { id, x, y }.
 */
export function calculateLayoutUpdates(shapes, type, startX, startY, padding = 40) {
  if (!shapes || shapes.length === 0) return [];

  const updates = [];
  const sortedShapes = [...shapes].sort((a, b) => (a.x + a.y) - (b.x + b.y));

  switch (type) {
    case LAYOUT_TYPES.GRID: {
      const cols = Math.ceil(Math.sqrt(sortedShapes.length));
      sortedShapes.forEach((shape, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const w = shape.width || (shape.radiusX * 2) || 100;
        const h = shape.height || (shape.radiusY * 2) || 100;
        
        updates.push({
          id: shape.id,
          x: startX + c * (w + padding),
          y: startY + r * (h + padding),
        });
      });
      break;
    }

    case LAYOUT_TYPES.STACK_H: {
      let currentX = startX;
      sortedShapes.forEach((shape) => {
        const w = shape.width || (shape.radiusX * 2) || 100;
        updates.push({
          id: shape.id,
          x: currentX,
          y: startY,
        });
        currentX += w + padding;
      });
      break;
    }

    case LAYOUT_TYPES.STACK_V: {
      let currentY = startY;
      sortedShapes.forEach((shape) => {
        const h = shape.height || (shape.radiusY * 2) || 100;
        updates.push({
          id: shape.id,
          x: startX,
          y: currentY,
        });
        currentY += h + padding;
      });
      break;
    }

    case LAYOUT_TYPES.CIRCLE: {
      const radius = Math.max(200, sortedShapes.length * 60);
      const centerX = startX + radius;
      const centerY = startY + radius;
      sortedShapes.forEach((shape, i) => {
        const angle = (i / sortedShapes.length) * Math.PI * 2;
        updates.push({
          id: shape.id,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        });
      });
      break;
    }

    case LAYOUT_TYPES.SPIRAL: {
        sortedShapes.forEach((shape, i) => {
            const angle = 0.5 * i;
            const radius = 20 * i;
            updates.push({
                id: shape.id,
                x: startX + Math.cos(angle) * radius,
                y: startY + Math.sin(angle) * radius,
            });
        });
        break;
    }

    case LAYOUT_TYPES.MIND_MAP: {
        // Simple radial mind map logic: First shape is root, others are children
        const root = sortedShapes[0];
        const children = sortedShapes.slice(1);
        const radius = 250;
        
        updates.push({ id: root.id, x: startX, y: startY });
        
        children.forEach((shape, i) => {
            const angle = (i / children.length) * Math.PI * 2;
            updates.push({
                id: shape.id,
                x: startX + Math.cos(angle) * radius,
                y: startY + Math.sin(angle) * radius,
            });
        });
        break;
    }

    default:
      break;
  }

  return updates;
}
