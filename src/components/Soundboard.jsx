import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Music, Zap, Heart, Star, Bell, AlertTriangle, PartyPopper, Lightbulb, PlayCircle, X } from 'lucide-react';

const SOUNDS = [
  { id: 'applause', label: 'Applause', icon: PartyPopper, color: '#f59e0b', url: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3' },
  { id: 'ding', label: 'Idea!', icon: Lightbulb, color: '#10b981', url: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3' },
  { id: 'error', label: 'Warning', icon: AlertTriangle, color: '#ef4444', url: 'https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3' },
  { id: 'victory', label: 'Victory', icon: Star, color: '#6366f1', url: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3' },
  { id: 'magic', label: 'Magic', icon: Zap, color: '#8b5cf6', url: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3' },
  { id: 'notification', label: 'Notice', icon: Bell, color: '#3b82f6', url: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3' },
];

export default function Soundboard({ isOpen, onClose, onPlaySound }) {
  const [muted, setMuted] = useState(false);

  const handlePlay = (sound) => {
    if (muted) return;
    onPlaySound(sound);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-24 right-24 w-80 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 p-6 z-[9999] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Music size={20} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Soundboard</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Shared Audio Room</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setMuted(!muted)}
                className={`p-2 rounded-xl transition-all ${muted ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <button 
                onClick={onClose}
                className="p-2 bg-slate-50 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 gap-3">
            {SOUNDS.map((sound) => {
              const Icon = sound.icon;
              return (
                <motion.button
                  key={sound.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePlay(sound)}
                  className="relative group overflow-hidden"
                >
                  <div 
                    className="h-20 flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-100 transition-all duration-300"
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500"
                      style={{ 
                        backgroundColor: `${sound.color}15`,
                        color: sound.color 
                      }}
                    >
                      <Icon size={20} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">
                      {sound.label}
                    </span>
                    
                    {/* Animated Ripple on hover */}
                    <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-center gap-2 py-2 px-4 bg-indigo-50 rounded-2xl">
             <PlayCircle size={14} className="text-indigo-600" />
             <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">Tap to play for everyone</span>
          </div>
          
          {/* Bottom decorative blob */}
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
