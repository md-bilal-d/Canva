import React, { useState } from 'react';
import { Palette, Sparkles, X, Check, Loader2, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PRESET_THEMES = [
  { name: 'Cyberpunk', colors: ['#000000', '#fdfd96', '#ff00ff', '#00ffff'], font: 'Orbitron' },
  { name: 'Minimalist', colors: ['#ffffff', '#f5f5f5', '#333333', '#000000'], font: 'Inter' },
  { name: 'Nature', colors: ['#f0fff4', '#c6f6d5', '#2f855a', '#22543d'], font: 'Outfit' },
  { name: 'Oceanic', colors: ['#ebf8ff', '#bee3f8', '#2b6cb0', '#2a4365'], font: 'Roboto' },
];

export default function ThemeGenerator({ isOpen, onClose, onApplyTheme }) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTheme, setGeneratedTheme] = useState(null);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    
    // Simulate AI Generation
    setTimeout(() => {
      const mockTheme = {
        primary: '#6366f1',
        secondary: '#f472b6',
        accent: '#fbbf24',
        background: '#f8fafc',
        font: 'Inter'
      };
      setGeneratedTheme(mockTheme);
      setIsGenerating(false);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[10000] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-3xl overflow-hidden flex flex-col border border-indigo-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
              <Palette size={24} />
            </div>
            <h3 className="text-xl font-bold">AI Theme Studio</h3>
          </div>
          <p className="text-indigo-100 text-sm">Transform your board's aesthetic with a single prompt.</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Describe the vibe</label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. 'Cozy autumnal sunset with warm oranges and browns' or 'High-tech dark mode with neon accents'"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none h-28"
              />
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="absolute bottom-3 right-3 bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50"
              >
                {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Wand2 size={20} />}
              </button>
            </div>
          </div>

          <div className="space-y-3">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Popular Presets</label>
             <div className="grid grid-cols-2 gap-3">
                {PRESET_THEMES.map(theme => (
                  <button
                    key={theme.name}
                    onClick={() => onApplyTheme(theme)}
                    className="flex flex-col items-start p-3 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                  >
                    <span className="text-xs font-bold text-gray-700 mb-2 group-hover:text-indigo-600">{theme.name}</span>
                    <div className="flex gap-1">
                      {theme.colors.map((c, i) => (
                        <div key={i} className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </button>
                ))}
             </div>
          </div>

          <AnimatePresence>
            {generatedTheme && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[generatedTheme.primary, generatedTheme.secondary, generatedTheme.accent, generatedTheme.background].map((c, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-indigo-900">AI Generated Theme</span>
                    <p className="text-[10px] text-indigo-600 font-medium">Ready to apply</p>
                  </div>
                </div>
                <button
                  onClick={() => onApplyTheme(generatedTheme)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  Apply <Check size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
