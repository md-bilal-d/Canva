import React, { useEffect, useState } from 'react';

export default function FloatingEmoji({ reaction }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Keep visible for the duration of the animation, then unmount
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="pointer-events-none flex flex-col items-center justify-center"
      style={{
        animation: 'floatUp 2.5s ease-out forwards',
      }}
    >
      <div style={{ fontSize: '2.5rem' }}>{reaction.emoji}</div>
      <div className="mt-1 whitespace-nowrap rounded bg-white/85 px-1.5 py-0.5 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur-sm">
        {reaction.userName}
      </div>
    </div>
  );
}
