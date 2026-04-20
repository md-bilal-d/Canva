import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';

export default function PhysicsWorld({ shapes, stickyNotes, onUpdate, isEnabled }) {
  const engineRef = useRef(Matter.Engine.create());
  const renderRef = useRef(null);
  const runnerRef = useRef(Matter.Runner.create());
  const bodiesMap = useRef(new Map());

  useEffect(() => {
    if (!isEnabled) {
      // Clear bodies if disabled
      Matter.Composite.clear(engineRef.current.world);
      bodiesMap.current.clear();
      return;
    }

    const { Engine, World, Bodies, Composite } = Matter;
    const world = engineRef.current.world;

    // Create a floor
    const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 50, window.innerWidth * 10, 100, { isStatic: true });
    Composite.add(world, ground);

    // Sync shapes and sticky notes to physics bodies
    const syncBodies = () => {
      const currentIds = new Set();

      // Shapes
      Object.values(shapes).forEach(shape => {
        currentIds.add(shape.id);
        if (!bodiesMap.current.has(shape.id)) {
          const body = Bodies.rectangle(shape.x + (shape.width || 100) / 2, shape.y + (shape.height || 100) / 2, shape.width || 100, shape.height || 100, {
             restitution: 0.5,
             friction: 0.1
          });
          body.label = shape.id;
          bodiesMap.current.set(shape.id, body);
          Composite.add(world, body);
        }
      });

      // Cleanup removed bodies
      bodiesMap.current.forEach((body, id) => {
        if (!currentIds.has(id)) {
          Composite.remove(world, body);
          bodiesMap.current.delete(id);
        }
      });
    };

    syncBodies();

    // Physics Loop
    const update = () => {
      if (!isEnabled) return;
      Matter.Engine.update(engineRef.current, 1000 / 60);
      
      const updates = [];
      bodiesMap.current.forEach((body, id) => {
        if (!body.isStatic) {
          updates.push({
            id,
            x: body.position.x - (shapes[id]?.width || 100) / 2,
            y: body.position.y - (shapes[id]?.height || 100) / 2,
            rotation: body.angle * (180 / Math.PI)
          });
        }
      });

      if (updates.length > 0) {
        onUpdate(updates);
      }
      
      requestAnimationFrame(update);
    };

    const animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);

  }, [isEnabled, shapes, stickyNotes]);

  return null; // Headless component
}
