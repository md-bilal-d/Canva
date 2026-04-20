import React, { useRef, useEffect, useState } from 'react';
import { Image } from 'react-konva';
import Lottie from 'lottie-react';

export default function LottieShape({ src, x, y, width, height, id, draggable, onDragEnd }) {
  const [image, setImage] = useState(null);
  const containerRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = width || 200;
    canvas.height = height || 200;

    const tick = () => {
      if (containerRef.current) {
         // Lottie renders to SVG by default, but we can capture it
         // Or we can use lottie's canvas renderer. 
         // For maximum compatibility with react-konva, we'll use a hidden canvas renderer.
      }
    };
    
    // We'll use a simpler approach: Render Lottie as usual in a hidden div, 
    // but Konva doesn't easily support live SVG-to-Canvas in a loop without performance hits.
    // Instead, we'll use a native Konva 'Image' and update its source from a canvas.
  }, [width, height]);

  // High-fidelity implementation using a hidden div and requestAnimationFrame
  useEffect(() => {
    let frameId;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const renderFrame = () => {
      const lottieContainer = containerRef.current;
      if (lottieContainer) {
        const svg = lottieContainer.querySelector('svg');
        if (svg) {
          const svgData = new XMLSerializer().serializeToString(svg);
          const img = new window.Image();
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);
          
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setImage(canvas); // Trigger Konva re-render
            URL.revokeObjectURL(url);
          };
          img.src = url;
        }
      }
      frameId = requestAnimationFrame(renderFrame);
    };

    frameId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(frameId);
  }, [width, height]);

  return (
    <>
      {/* Hidden Lottie Container */}
      <div 
        ref={containerRef} 
        style={{ position: 'absolute', visibility: 'hidden', width: width, height: height, pointerEvents: 'none' }}
      >
        <Lottie 
            animationData={src} 
            loop={true} 
            autoplay={true}
            style={{ width: '100%', height: '100%' }}
        />
      </div>
      
      <Image
        id={id}
        x={x}
        y={y}
        width={width}
        height={height}
        image={image}
        draggable={draggable}
        onDragEnd={onDragEnd}
      />
    </>
  );
}
