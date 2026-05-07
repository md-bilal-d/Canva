/**
 * useShapeRecognition.js
 * A hook to recognize hand-drawn shapes on the canvas.
 */

import { useCallback } from 'react';

export default function useShapeRecognition() {
  const recognize = useCallback((points) => {
    if (!points || points.length < 10) return null;

    // 1. Calculate bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach((p, i) => {
      if (i % 2 === 0) {
        if (p < minX) minX = p;
        if (p > maxX) maxX = p;
      } else {
        if (p < minY) minY = p;
        if (p > maxY) maxY = p;
      }
    });

    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = minX + width / 2;
    const centerY = minY + height / 2;
    const diagonal = Math.sqrt(width * width + height * height);

    if (diagonal < 20) return null; // Too small

    // 2. Calculate aspect ratio
    const aspectRatio = width / height;

    // 3. Calculate distance from center variance (for circle)
    let totalDist = 0;
    const dists = [];
    for (let i = 0; i < points.length; i += 2) {
      const dx = points[i] - centerX;
      const dy = points[i+1] - centerY;
      const d = Math.sqrt(dx * dx + dy * dy);
      totalDist += d;
      dists.push(d);
    }
    const avgDist = totalDist / dists.length;
    let variance = 0;
    dists.forEach(d => {
      variance += Math.abs(d - avgDist);
    });
    const avgVariance = variance / dists.length;
    const circleScore = avgVariance / avgDist; // Lower is more circular

    // 4. Calculate "straightness" (for rectangle/line)
    // Simplified: Check if points are concentrated near the edges of the bounding box
    let edgeCount = 0;
    for (let i = 0; i < points.length; i += 2) {
      const px = points[i];
      const py = points[i+1];
      const nearLeft = Math.abs(px - minX) < width * 0.15;
      const nearRight = Math.abs(px - maxX) < width * 0.15;
      const nearTop = Math.abs(py - minY) < height * 0.15;
      const nearBottom = Math.abs(py - maxY) < height * 0.15;
      if (nearLeft || nearRight || nearTop || nearBottom) edgeCount++;
    }
    const edgeDensity = edgeCount / (points.length / 2);

    // Decision Logic
    if (circleScore < 0.15) {
      return {
        type: 'circle',
        x: centerX,
        y: centerY,
        radius: (width + height) / 4
      };
    }

    if (edgeDensity > 0.8 && aspectRatio > 0.2 && aspectRatio < 5) {
        return {
            type: 'rect',
            x: minX,
            y: minY,
            width: width,
            height: height
        };
    }

    // Default to null (keep as hand-drawn line)
    return null;
  }, []);

  return { recognize };
}
