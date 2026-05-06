import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const REACTION_EMOJIS = ['🎉', '💖', '🔥', '👀', '👍', '😮', '😂', '🤔'];

export default function ReactionWheel({ x, y, onSelect, onClose }) {
  return (
    <div 
      className="fixed inset-0 z-[10000] pointer-events-auto"
      onClick={onClose}
      onContextMenu={(e) => { e.preventDefault(); onClose(); }}
    >
      <div 
        style={{ left: x, top: y }}
        className="absolute"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative"
          >
            {/* Background Ring */}
            <div className="absolute inset-0 -m-16 w-32 h-32 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl" />
            
            {/* Emojis in a Circle */}
            {REACTION_EMOJIS.map((emoji, i) => {
              const angle = (i / REACTION_EMOJIS.length) * Math.PI * 2 - Math.PI / 2;
              const radius = 60;
              const ex = Math.cos(angle) * radius;
              const ey = Math.sin(angle) * radius;
              
              return (
                <motion.button
                  key={emoji}
                  initial={{ x: 0, y: 0 }}
                  animate={{ x: ex, y: ey }}
                  whileHover={{ scale: 1.3, zIndex: 10 }}
                  onClick={() => {
                    onSelect(emoji);
                    onClose();
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg border border-indigo-50 flex items-center justify-center text-2xl hover:bg-indigo-50 transition-colors"
                >
                  {emoji}
                </motion.button>
              );
            })}
            
            {/* Center Close / Indicator */}
            <div className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 rounded-full shadow-lg flex items-center justify-center text-white font-bold text-xs pointer-events-none">
                REACT
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
