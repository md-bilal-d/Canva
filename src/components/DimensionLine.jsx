import React from 'react';
import { Group, Line, Text, Arrow } from 'react-konva';

/**
 * DimensionLine renders a technical measurement line between two points.
 * It includes arrows at both ends and a text label showing the distance.
 */
export default function DimensionLine({ 
    id, 
    points, 
    color = '#6366f1', 
    strokeWidth = 2, 
    scaleFactor = 1, // 1px = X units
    unit = 'cm',
    onDblClick
}) {
    if (!points || points.length < 4) return null;

    const x1 = points[0];
    const y1 = points[1];
    const x2 = points[2];
    const y2 = points[3];

    // Calculate distance
    const distPx = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const distScaled = (distPx * scaleFactor).toFixed(1);

    // Calculate center for text
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;

    // Calculate angle for text rotation
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

    return (
        <Group id={id} onDblClick={onDblClick}>
            {/* Main Dimension Line */}
            <Line
                points={[x1, y1, x2, y2]}
                stroke={color}
                strokeWidth={strokeWidth}
                dash={[2, 2]} // Technical dash look
            />

            {/* Arrows at ends */}
            <Arrow
                points={[x2, y2, x1, y1]}
                stroke={color}
                fill={color}
                pointerLength={8}
                pointerWidth={6}
                strokeWidth={strokeWidth}
            />
            <Arrow
                points={[x1, y1, x2, y2]}
                stroke={color}
                fill={color}
                pointerLength={8}
                pointerWidth={6}
                strokeWidth={strokeWidth}
            />

            {/* Label Background & Text */}
            <Group x={cx} y={cy} rotation={angle}>
                <Text
                    text={`${distScaled}${unit}`}
                    fontSize={12}
                    fontFamily="Inter, sans-serif"
                    fontStyle="bold"
                    fill={color}
                    align="center"
                    verticalAlign="middle"
                    offsetY={14} // Float above the line
                    offsetX={(distScaled.length + unit.length) * 3}
                />
            </Group>
        </Group>
    );
}
