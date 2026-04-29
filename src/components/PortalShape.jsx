import React, { useEffect, useState } from 'react';
import { Group, Circle, Text, Arc, Star } from 'react-konva';

export default function PortalShape({ shape, onNavigate, isSelected, draggable }) {
  const { id, x, y, name, targetX, targetY, targetScale, color = '#6366f1' } = shape;
  const radius = 45;
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    let frame;
    const animate = () => {
      setRotation(r => (r + 2) % 360);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <Group
      x={x}
      y={y}
      draggable={draggable}
      onClick={() => onNavigate({ x: targetX || 0, y: targetY || 0, scale: targetScale || 1 })}
      onTap={() => onNavigate({ x: targetX || 0, y: targetY || 0, scale: targetScale || 1 })}
      onMouseEnter={(e) => {
        const stage = e.target.getStage();
        stage.container().style.cursor = 'pointer';
      }}
      onMouseLeave={(e) => {
        const stage = e.target.getStage();
        stage.container().style.cursor = 'default';
      }}
    >
      {/* Outer Glow */}
      <Circle
        radius={radius + 15}
        fillRadialGradientStartPoint={{ x: 0, y: 0 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndRadius={radius + 15}
        fillRadialGradientColorStops={[0, color, 1, 'transparent']}
        opacity={0.3}
      />

      {/* Swirling Rings */}
      <Circle
        radius={radius + 5}
        stroke={color}
        strokeWidth={1}
        dash={[10, 10]}
        rotation={-rotation}
        opacity={0.5}
      />
      
      {/* Main Portal Body (Glassmorphism Effect) */}
      <Circle
        radius={radius}
        fillRadialGradientStartPoint={{ x: -10, y: -10 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndRadius={radius}
        fillRadialGradientColorStops={[0, 'white', 0.5, color, 1, '#1e1b4b']}
        opacity={0.8}
        stroke="white"
        strokeWidth={2}
        shadowBlur={20}
        shadowColor={color}
      />

      {/* Rotating Arcs / Vortex Spokes */}
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <Arc
          key={angle}
          innerRadius={radius - 15}
          outerRadius={radius - 5}
          angle={30}
          rotation={angle + rotation}
          fill="white"
          opacity={0.6}
        />
      ))}

      {/* Center Star / Core */}
      <Star
        numPoints={5}
        innerRadius={5}
        outerRadius={12}
        fill="white"
        rotation={rotation * 2}
        shadowBlur={10}
        shadowColor="white"
      />
      
      {/* Portal Label with Glow */}
      <Text
        text={name || 'Portal'}
        y={radius + 25}
        width={160}
        offsetX={80}
        align="center"
        fontSize={14}
        fontFamily="Outfit, sans-serif"
        fontStyle="bold"
        fill={color}
        shadowBlur={5}
        shadowColor="white"
      />
      
      <Text
        text="ENTER DIMENSION"
        y={radius + 45}
        width={160}
        offsetX={80}
        align="center"
        fontSize={9}
        fontFamily="Inter, sans-serif"
        fontStyle="bold"
        fill="#94a3b8"
        letterSpacing={2}
      />

      {isSelected && (
        <Circle
          radius={radius + 20}
          stroke="#4f46e5"
          strokeWidth={2}
          dash={[4, 4]}
          rotation={rotation / 2}
        />
      )}
    </Group>
  );
}
