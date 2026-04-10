// ============================================================
// useTouchCanvas — Multi-touch support for mobile canvas
// ============================================================

import { useCallback, useRef } from 'react';

/**
 * Calculates the distance between two touch points.
 */
function getDistance(t1, t2) {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates the midpoint between two touch points.
 */
function getMidpoint(t1, t2) {
  return {
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  };
}

export default function useTouchCanvas({ onDraw, onZoom, onPan, onDrawEnd }) {
  const touchStateRef = useRef({
    mode: null,       // 'draw' | 'pinch' | null
    lastDist: null,
    lastMid: null,
    isStylus: false,
  });

  const onTouchStart = useCallback((e) => {
    const touches = e.touches;

    if (touches.length === 1) {
      const touch = touches[0];

      // Detect stylus
      const isStylus = touch.touchType === 'stylus';
      touchStateRef.current.isStylus = isStylus;

      // Palm rejection: large radius means palm
      if (!isStylus && touch.radiusX > 30 && touch.radiusY > 30) {
        return; // Ignore palm touch
      }

      touchStateRef.current.mode = 'draw';

      // Calculate pressure-sensitive width for stylus
      const force = touch.force || 0;
      const pressureWidth = isStylus ? Math.max(1, Math.round(force * 10)) : undefined;

      if (onDraw) {
        onDraw({
          type: 'start',
          x: touch.clientX,
          y: touch.clientY,
          pressure: force,
          pressureWidth,
          isStylus,
        });
      }
    } else if (touches.length === 2) {
      // Switch to pinch/pan mode
      touchStateRef.current.mode = 'pinch';
      touchStateRef.current.lastDist = getDistance(touches[0], touches[1]);
      touchStateRef.current.lastMid = getMidpoint(touches[0], touches[1]);
    }
  }, [onDraw]);

  const onTouchMove = useCallback((e) => {
    e.preventDefault(); // Prevent browser scroll/zoom

    const touches = e.touches;
    const state = touchStateRef.current;

    if (state.mode === 'draw' && touches.length === 1) {
      const touch = touches[0];

      // Palm rejection (skip if stylus)
      if (!state.isStylus && touch.radiusX > 30 && touch.radiusY > 30) {
        return;
      }

      const force = touch.force || 0;
      const pressureWidth = state.isStylus ? Math.max(1, Math.round(force * 10)) : undefined;

      if (onDraw) {
        onDraw({
          type: 'move',
          x: touch.clientX,
          y: touch.clientY,
          pressure: force,
          pressureWidth,
          isStylus: state.isStylus,
        });
      }
    } else if (state.mode === 'pinch' && touches.length === 2) {
      const newDist = getDistance(touches[0], touches[1]);
      const newMid = getMidpoint(touches[0], touches[1]);

      // Zoom
      if (state.lastDist && onZoom) {
        const scale = newDist / state.lastDist;
        onZoom({ scale, center: newMid });
      }

      // Pan
      if (state.lastMid && onPan) {
        const dx = newMid.x - state.lastMid.x;
        const dy = newMid.y - state.lastMid.y;
        onPan({ dx, dy });
      }

      state.lastDist = newDist;
      state.lastMid = newMid;
    }
  }, [onDraw, onZoom, onPan]);

  const onTouchEnd = useCallback((e) => {
    const state = touchStateRef.current;

    if (state.mode === 'draw' && onDrawEnd) {
      onDrawEnd();
    }

    if (e.touches.length === 0) {
      state.mode = null;
      state.lastDist = null;
      state.lastMid = null;
      state.isStylus = false;
    } else if (e.touches.length === 1) {
      // Went from 2 fingers to 1, switch to draw
      state.mode = 'draw';
      state.lastDist = null;
      state.lastMid = null;
    }
  }, [onDrawEnd]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
