import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';

export default function PhysicsWorld({ shapes, stickyNotes, onUpdate, isEnabled, isSandbox }) {
  const engineRef = useRef(Matter.Engine.create());
  const bodiesMap = useRef(new Map());

  useEffect(() => {
    const engine = engineRef.current;
    
    if (!isEnabled) {
      Matter.Composite.clear(engine.world);
      bodiesMap.current.clear();
      return;
    }

    const { World, Bodies, Composite } = Matter;
    const world = engine.world;

    // Configure gravity based on sandbox mode
    world.gravity.y = isSandbox ? 1 : 0;

    // Create boundaries (Walls) to keep things inside the viewport
    const thickness = 1000;
    const walls = [
        // Ground
        Bodies.rectangle(window.innerWidth / 2, window.innerHeight + thickness / 2, window.innerWidth * 10, thickness, { isStatic: true }),
        // Ceiling
        Bodies.rectangle(window.innerWidth / 2, -thickness / 2, window.innerWidth * 10, thickness, { isStatic: true }),
        // Left
        Bodies.rectangle(-thickness / 2, window.innerHeight / 2, thickness, window.innerHeight * 10, { isStatic: true }),
        // Right
        Bodies.rectangle(window.innerWidth + thickness / 2, window.innerHeight / 2, thickness, window.innerHeight * 10, { isStatic: true })
    ];
    Composite.add(world, walls);

    // Sync shapes and sticky notes to physics bodies
    const syncBodies = () => {
      const currentIds = new Set();

      // Combine shapes and sticky notes for physics
      const allItems = [
          ...Object.values(shapes || {}).map(s => ({ ...s, itemType: 'shape' })),
          ...Object.entries(stickyNotes || {}).map(([id, n]) => ({ 
              id, 
              itemType: 'note', 
              x: n.get('x'), 
              y: n.get('y'), 
              width: 200, 
              height: 150 
          }))
      ];

      allItems.forEach(item => {
        currentIds.add(item.id);
        if (!bodiesMap.current.has(item.id)) {
          const w = item.width || 100;
          const h = item.height || 100;
          
          let body;
          if (item.type === 'circle') {
              body = Bodies.circle(item.x, item.y, (item.radiusX || 50), {
                  restitution: 0.6,
                  friction: 0.1,
                  frictionAir: isSandbox ? 0.01 : 0.05
              });
          } else {
              body = Bodies.rectangle(item.x + w/2, item.y + h/2, w, h, {
                  restitution: 0.5,
                  friction: 0.1,
                  frictionAir: isSandbox ? 0.01 : 0.05,
                  chamfer: { radius: 10 }
              });
          }
          
          body.label = item.id;
          body.itemType = item.itemType;
          bodiesMap.current.set(item.id, body);
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
    let frameId;
    const update = () => {
      if (!isEnabled) return;
      
      // Fixed time step for stability
      Matter.Engine.update(engine, 1000 / 60);
      
      const updates = [];
      bodiesMap.current.forEach((body, id) => {
        if (!body.isStatic) {
          // Check if body is actually moving to avoid unnecessary updates
          const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
          const angularSpeed = Math.abs(body.angularVelocity);
          
          if (speed > 0.01 || angularSpeed > 0.01) {
            updates.push({
              id,
              type: body.itemType,
              x: body.position.x - (body.itemType === 'shape' ? (shapes[id]?.width || 100) / 2 : 100),
              y: body.position.y - (body.itemType === 'shape' ? (shapes[id]?.height || 100) / 2 : 75),
              angle: body.angle,
              velocity: { x: body.velocity.x, y: body.velocity.y },
              angularVelocity: body.angularVelocity
            });
          }
        }
      });

      if (updates.length > 0) {
        onUpdate({ items: updates });
      }
      
      frameId = requestAnimationFrame(update);
    };

    // Collision Impact Detection
    Matter.Events.on(engine, 'collisionStart', (event) => {
        if (!isEnabled) return;
        event.pairs.forEach((pair) => {
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;
            
            // Trigger impact effect logic (could be passed via props)
            if (pair.collision.depth > 2) {
                // High impact
            }
        });
    });

    frameId = requestAnimationFrame(update);
    return () => {
        cancelAnimationFrame(frameId);
        Matter.Events.off(engine);
        Matter.Composite.clear(world);
    };

  }, [isEnabled, isSandbox, shapes, stickyNotes, onUpdate]);

  return null;
}
