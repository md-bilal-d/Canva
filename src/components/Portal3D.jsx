import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Float, 
  Text, 
  MeshDistortMaterial, 
  Environment,
  ContactShadows,
  Html
} from '@react-three/drei';
import * as THREE from 'three';

/**
 * Renders a single sticky note as a 3D card.
 */
function StickyNote3D({ id, noteMap }) {
  const x = noteMap.get('x') || 0;
  const y = noteMap.get('y') || 0;
  const color = noteMap.get('backgroundColor') || '#fef08a';
  const text = noteMap.get('textContent')?.toString() || '';

  // Convert canvas coords to 3D coords (scaled down)
  const pos = [x / 100, -y / 100, 0];

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh position={pos}>
        <boxGeometry args={[2, 1.5, 0.1]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
        
        {/* Front Face Text */}
        <Text
          position={[0, 0, 0.06]}
          fontSize={0.15}
          color="#1e293b"
          maxWidth={1.8}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
        >
          {text}
        </Text>
      </mesh>
    </Float>
  );
}

/**
 * Renders a shape (Rect/Circle) as a 3D object.
 */
function Shape3D({ id, shape }) {
  const { type, x, y, width, height, radiusX, radiusY, color, label } = shape;
  const pos = [x / 100, -y / 100, -0.5];
  
  const w = (width || radiusX * 2 || 100) / 100;
  const h = (height || radiusY * 2 || 100) / 100;

  return (
    <mesh position={pos}>
      {type === 'circle' ? (
        <cylinderGeometry args={[w / 2, w / 2, 0.2, 32]} rotation={[Math.PI / 2, 0, 0]} />
      ) : (
        <boxGeometry args={[w, h, 0.2]} />
      )}
      <meshStandardMaterial color={color || '#6366f1'} roughness={0.2} metalness={0.5} />
      {label && (
        <Text
          position={[0, 0, 0.12]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}
    </mesh>
  );
}

/**
 * Main 3D Portal View.
 */
export default function Portal3D({ shapes, stickyNotes, onClose }) {
  const shapeElements = useMemo(() => {
    return Object.entries(shapes).map(([id, shape]) => (
      <Shape3D key={id} id={id} shape={shape} />
    ));
  }, [shapes]);

  const noteElements = useMemo(() => {
    return Object.entries(stickyNotes).map(([id, noteMap]) => (
      <StickyNote3D key={id} id={id} noteMap={noteMap} />
    ));
  }, [stickyNotes]);

  return (
    <div className="fixed inset-0 z-[2000] bg-[#020617]">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={50} />
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 4}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

        {/* Environment */}
        <Environment preset="city" />
        <ContactShadows 
          position={[0, -5, 0]} 
          opacity={0.4} 
          scale={20} 
          blur={2} 
          far={4.5} 
        />

        {/* Floating Particles/Background Elements */}
        <Stars count={5000} speed={1} />

        {/* The Board Content */}
        <group position={[0, 0, 0]}>
            {shapeElements}
            {noteElements}
        </group>

        {/* Ground Plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <MeshDistortMaterial 
            color="#1e1b4b" 
            speed={2} 
            distort={0.1} 
            roughness={0.1} 
            metalness={0.8} 
          />
        </mesh>
      </Canvas>

      {/* Overlay Controls */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl shadow-2xl z-[2001] animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Dimension</span>
            <h2 className="text-lg font-black text-white leading-none">PORTAL 3D</h2>
        </div>
        <div className="h-8 w-[1px] bg-white/10 mx-2" />
        <button 
          onClick={onClose}
          className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-500 hover:text-white transition-all shadow-lg"
        >
          EXIT PORTAL
        </button>
      </div>

      <div className="absolute bottom-8 left-8 text-white/40 text-[10px] font-medium uppercase tracking-widest pointer-events-none">
        Use Mouse to Rotate & Zoom • Space to Pan
      </div>
    </div>
  );
}

/**
 * Simple Star background.
 */
function Stars({ count = 5000, speed = 1 }) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 100;
      p[i * 3 + 1] = (Math.random() - 0.5) * 100;
      p[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    return p;
  }, [count]);

  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
        ref.current.rotation.y += 0.0005 * speed;
        ref.current.rotation.x += 0.0002 * speed;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#6366f1" sizeAttenuation />
    </points>
  );
}
