import React, { useState } from 'react';
import { Sparkles, X, Image as ImageIcon, Download, Plus, Loader2, Wand2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { insertDesignFromAI } from '../utils/AIDispatcher';

export default function AIImageStudio({ isOpen, onClose, ydoc, viewportCenter }) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState([]);
  const [activeTab, setActiveTab] = useState('generate');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    // Simulate API delay
    setTimeout(() => {
      const newResults = [
        {
          id: Date.now() + 1,
          src: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&h=300&auto=format&fit=crop&sig=${Math.random()}`,
          prompt: prompt
        },
        {
          id: Date.now() + 2,
          src: `https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=400&h=300&auto=format&fit=crop&sig=${Math.random()}`,
          prompt: prompt
        },
        {
          id: Date.now() + 3,
          src: `https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=400&h=300&auto=format&fit=crop&sig=${Math.random()}`,
          prompt: prompt
        },
        {
          id: Date.now() + 4,
          src: `https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=400&h=300&auto=format&fit=crop&sig=${Math.random()}`,
          prompt: prompt
        }
      ];
      setResults(newResults);
      setIsGenerating(false);
    }, 1500);
  };

  const handleInsert = (result) => {
    insertDesignFromAI(ydoc, viewportCenter, 1, 'image', {
      src: result.src,
      prompt: result.prompt
    });
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="fixed top-24 left-6 w-96 bg-white/90 backdrop-blur-xl border border-indigo-100 rounded-3xl shadow-3xl z-[5000] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 border-b border-indigo-50 flex justify-between items-center bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">AI Image Studio</h3>
            <p className="text-[10px] text-indigo-500 font-medium tracking-wider uppercase">Creative Engine v2.0</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-indigo-50 px-4">
        {['generate', 'library'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-xs font-bold capitalize transition-all relative ${
              activeTab === tab ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
              />
            )}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-5 overflow-y-auto max-h-[600px]">
        {activeTab === 'generate' ? (
          <>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Describe your vision</label>
              <div className="relative">
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A futuristic city with floating neon gardens, digital oil painting style..."
                  className="w-full bg-gray-50 border border-indigo-50 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none h-28 placeholder:text-gray-300"
                />
                <div className="absolute bottom-3 right-3 flex gap-2">
                   <button className="p-1.5 bg-white border border-indigo-50 text-indigo-500 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm">
                      <Wand2 size={14} />
                   </button>
                </div>
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                isGenerating || !prompt.trim()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate Magic
                </>
              )}
            </button>

            {results.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-900">Recent Creations</h4>
                  <button className="text-[10px] font-bold text-indigo-600 hover:underline">Clear all</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {results.map((res) => (
                    <motion.div 
                      key={res.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileHover={{ y: -4 }}
                      className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-indigo-50 shadow-sm cursor-pointer"
                    >
                      <img src={res.src} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Generated" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <button 
                          onClick={() => handleInsert(res)}
                          className="w-full bg-white text-indigo-600 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-50 transition-colors"
                        >
                          <Plus size={12} />
                          Add to Canvas
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                <ImageIcon size={32} />
             </div>
             <div>
                <h4 className="font-bold text-gray-900 text-sm">Your Library is Empty</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-[200px] mx-auto">Generated images will appear here for easy access across boards.</p>
             </div>
             <button onClick={() => setActiveTab('generate')} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors">
                Start Generating
             </button>
          </div>
        )}
      </div>

      <div className="p-4 bg-indigo-50/30 border-t border-indigo-50">
         <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <Search size={12} />
            <span>Search royalty-free images coming soon</span>
         </div>
      </div>
    </motion.div>
  );
}
