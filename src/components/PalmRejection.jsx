// ============================================================
// PalmRejection — Touch event filter wrapper
// ============================================================

import React, { useCallback, useRef } from 'react';

/**
 * Wraps the canvas container and filters out palm touches.
 * 
 * Detection: if touch.radiusX > 30 && touch.radiusY > 30, it's likely a palm.
 * When a stylus is detected (touch.touchType === 'stylus'), palm rejection is
 * disabled to avoid false positives.
 */
export default function PalmRejection({ children, enabled = true }) {
  const stylusDetectedRef = useRef(false);

  const handleTouchStart = useCallback(
    (e) => {
      if (!enabled) return;

      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];

        // Detect stylus — disable palm rejection
        if (touch.touchType === 'stylus') {
          stylusDetectedRef.current = true;
          return;
        }

        // Palm detection: large radius = palm touch
        if (!stylusDetectedRef.current && touch.radiusX > 30 && touch.radiusY > 30) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (!enabled) return;

      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];

        if (touch.touchType === 'stylus') {
          stylusDetectedRef.current = true;
          return;
        }

        if (!stylusDetectedRef.current && touch.radiusX > 30 && touch.radiusY > 30) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }
    },
    [enabled]
  );

  const handleTouchEnd = useCallback((e) => {
    if (e.touches.length === 0) {
      // Reset stylus detection when all touches end
      stylusDetectedRef.current = false;
    }
  }, []);

  return (
    <div
      onTouchStartCapture={handleTouchStart}
      onTouchMoveCapture={handleTouchMove}
      onTouchEndCapture={handleTouchEnd}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </div>
  );
}
