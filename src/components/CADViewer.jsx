import React, { Suspense, useMemo } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Stage, Center, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';

/**
 * A fallback component while the model is loading.
 */
function Loader() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="gray" wireframe />
    </mesh>
  );
}

/**
 * Renders an STL model from a URL.
 */
function Model({ url }) {
  // Memoize geometry to avoid re-parsing on every render
  const geometry = useLoader(STLLoader, url);
  
  return (
    <Center top>
      <mesh geometry={geometry}>
        <meshStandardMaterial 
            color="#94a3b8" // Sleek slate color
            roughness={0.3} 
            metalness={0.8} 
        />
      </mesh>
    </Center>
  );
}

/**
 * CADViewer wraps the 3D canvas and provides technical controls.
 */
export default function CADViewer({ url, width = 300, height = 300 }) {
  if (!url) return null;

  return (
    <div style={{ width, height, borderRadius: '8px', overflow: 'hidden', background: '#0f172a' }}>
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
        <Suspense fallback={<Loader />}>
          <Stage environment="city" intensity={0.6}>
            <Model url={url} />
          </Stage>
        </Suspense>
        <OrbitControls makeDefault />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
