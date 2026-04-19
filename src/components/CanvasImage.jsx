import React from 'react';
import { Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

export default function CanvasImage({ shape, ...props }) {
  const [image] = useImage(shape.src, 'anonymous');

  if (!image) {
    // Show a placeholder while loading
    return (
      <KonvaImage
        {...props}
        width={shape.width || 100}
        height={shape.height || 100}
        opacity={0.3}
      />
    );
  }

  return (
    <KonvaImage
      image={image}
      {...props}
      width={shape.width}
      height={shape.height}
    />
  );
}
