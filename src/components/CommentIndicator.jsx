// ============================================================
// CommentIndicator — Orange badge on shapes with unresolved comments
// ============================================================

import React from 'react';
import { Layer, Circle, Text, Group } from 'react-konva';

/**
 * Gets the top-right corner position for a badge on a shape.
 */
function getBadgePosition(shape) {
  if (!shape) return { x: 0, y: 0 };

  if (shape.type === 'rect') {
    const sx = shape.scaleX || 1;
    const sy = shape.scaleY || 1;
    return {
      x: shape.x + shape.width * sx,
      y: shape.y,
    };
  } else if (shape.type === 'circle') {
    const sx = shape.scaleX || 1;
    return {
      x: shape.x + (shape.radiusX || 50) * sx,
      y: shape.y - (shape.radiusY || 50) * (shape.scaleY || 1),
    };
  }
  return { x: shape.x || 0, y: shape.y || 0 };
}

export default function CommentIndicator({
  shapes,
  unresolvedShapeIds,
  comments,
  stageScale,
  onBadgeClick,
}) {
  if (!unresolvedShapeIds || unresolvedShapeIds.length === 0) return null;

  return (
    <Layer name="comment-indicator-layer" listening={true}>
      {unresolvedShapeIds.map((shapeId) => {
        const shape = shapes[shapeId];
        if (!shape) return null;

        const pos = getBadgePosition(shape);
        const count = (comments[shapeId] || []).filter((c) => !c.resolved).length;
        const r = 10 / stageScale;

        return (
          <Group
            key={`badge-${shapeId}`}
            x={pos.x + 4 / stageScale}
            y={pos.y - 4 / stageScale}
            onClick={() => onBadgeClick?.(shapeId, pos)}
            onTap={() => onBadgeClick?.(shapeId, pos)}
            style={{ cursor: 'pointer' }}
          >
            <Circle
              radius={r}
              fill="#f97316"
              stroke="#ffffff"
              strokeWidth={2 / stageScale}
              shadowBlur={4}
              shadowOpacity={0.2}
              shadowColor="#000000"
            />
            {count > 0 && (
              <Text
                text={String(count)}
                fontSize={9 / stageScale}
                fill="#ffffff"
                fontFamily="Inter, sans-serif"
                fontStyle="700"
                align="center"
                verticalAlign="middle"
                width={r * 2}
                height={r * 2}
                offsetX={r}
                offsetY={r}
                listening={false}
              />
            )}
          </Group>
        );
      })}
    </Layer>
  );
}
