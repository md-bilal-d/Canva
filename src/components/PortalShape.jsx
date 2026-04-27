import React from 'react';
import { Group, Circle, Text, Arc } from 'react-konva';
import { Compass } from 'lucide-react';

export default function PortalShape({ shape, onNavigate, isSelected, draggable }) {
  const { id, x, y, name, targetX, targetY, targetScale, color = '#6366f1' } = shape;
  const radius = 40;

  return (
    <Group
      x={x}
      y={y}
      draggable={draggable}
      onClick={() => onNavigate({ x: targetX, y: targetY, scale: targetScale })}
      onTap={() => onNavigate({ x: targetX, y: targetY, scale: targetScale })}
      onMouseEnter={(e) => {
        const stage = e.target.getStage();
        stage.container().style.cursor = 'pointer';
      }}
      onMouseLeave={(e) => {
        const stage = e.target.getStage();
        stage.container().style.cursor = 'default';
      }}
    >
      {/* Outer Ring */}
      <Circle
        radius={radius + 5}
        stroke={color}
        strokeWidth={2}
        dash={[5, 5]}
        opacity={0.5}
      />
      
      {/* Main Portal Body */}
      <Circle
        radius={radius}
        fill={color}
        opacity={0.2}
        stroke={color}
        strokeWidth={3}
        shadowBlur={10}
        shadowColor={color}
      />

      {/* Decorative Arcs */}
      {[0, 120, 240].map((angle) => (
        <Arc
          key={angle}
          innerRadius={radius - 10}
          outerRadius={radius - 5}
          angle={60}
          rotation={angle + (Date.now() / 20) % 360}
          fill={color}
        />
      ))}

      {/* Portal Icon (Simulated with Konva shapes) */}
      <Circle radius={15} fill="white" opacity={0.8} />
      
      {/* Portal Label */}
      <Text
        text={name || 'Portal'}
        y={radius + 15}
        width={120}
        offsetX={60}
        align="center"
        fontSize={12}
        fontStyle="bold"
        fill={color}
      />
      
      <Text
        text="Click to Teleport"
        y={radius + 30}
        width={120}
        offsetX={60}
        align="center"
        fontSize={10}
        fill="#94a3b8"
      />

      {isSelected && (
        <Circle
          radius={radius + 10}
          stroke="#4f46e5"
          strokeWidth={1}
          dash={[2, 2]}
        />
      )}
    </Group>
  );
}
