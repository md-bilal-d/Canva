import React from 'react';
import { Group, Rect, Text } from 'react-konva';

export default function FrameShape({ shape, onSelect, isSelected, draggable }) {
  const { x, y, width, height, name, color } = shape;
  const padding = 8;
  const labelHeight = 24;

  return (
    <Group
      x={x}
      y={y}
      onClick={onSelect}
      onTap={onSelect}
      draggable={draggable}
      onDragEnd={(e) => {
        // Logic will be handled in App.jsx via common drag handlers
      }}
    >
      {/* Frame Border */}
      <Rect
        width={width}
        height={height}
        stroke={isSelected ? '#3b82f6' : '#cbd5e1'}
        strokeWidth={isSelected ? 2 : 1}
        dash={isSelected ? [] : [10, 5]}
        cornerRadius={4}
      />

      {/* Frame Label Container */}
      <Group y={-labelHeight - 4}>
        <Rect
          width={Math.max(80, name?.length * 8 || 80)}
          height={labelHeight}
          fill={isSelected ? '#3b82f6' : '#94a3b8'}
          cornerRadius={4}
        />
        <Text
          text={name || 'Untitled Frame'}
          fontSize={12}
          fontFamily="Inter, sans-serif"
          fill="white"
          padding={6}
          align="center"
          verticalAlign="middle"
        />
      </Group>

      {/* Optional: Subtle background to indicate "container" area */}
      <Rect
        width={width}
        height={height}
        fill={color || 'transparent'}
        opacity={0.02}
        listening={false}
      />
    </Group>
  );
}
