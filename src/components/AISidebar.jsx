import React, { useState } from 'react';
import { Sparkles, TerminalSquare, Send, X, Loader2 } from 'lucide-react';
import { insertDesignFromAI } from '../utils/AIDispatcher';
import * as Y from 'yjs';

window.Y = Y; // Make Y available for AIDispatcher.js to avoid double importing issues

export default function AISidebar({ isOpen, onClose, ydoc, viewportCenter, stageScale }) {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('layout'); // 'layout' or 'image'
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = () => {
    if (!prompt.trim() || !ydoc) return;
    
    setIsGenerating(true);
    
    // Simulate AI processing delay
    setTimeout(() => {
        if (mode === 'image') {
            const id = 'image-' + Date.now();
            // Use a high-quality placeholder that looks like a real AI generation for now
            const seed = Math.floor(Math.random() * 1000);
            const imageUrl = `https://picsum.photos/seed/${seed}/800/600`;
            
            insertDesignFromAI(ydoc, viewportCenter, stageScale, 'image', { src: imageUrl, prompt });
        } else {
            const lower = prompt.toLowerCase();
            let intent = 'moodboard';
            let params = { prompt };

            if (lower.includes('flow') || lower.includes('process')) {
                intent = 'flowchart';
                params.steps = ['Start', 'Step 1', 'Step 2', 'Finish'];
            } else if (lower.includes('mind') || lower.includes('map')) {
                intent = 'mindmap';
                params.topic = 'Central Idea';
                params.branches = ['Research', 'Design', 'Develop', 'Launch'];
            } else if (lower.includes('clear') || lower.includes('erase')) {
                intent = 'clear';
            }

            insertDesignFromAI(ydoc, viewportCenter, stageScale, intent, params);
        }
        
        setIsGenerating(false);
        setPrompt('');
        onClose();
    }, 1500);
  };

  return (
    <div className="absolute right-6 top-6 w-80 bg-white/95 backdrop-blur-xl border border-indigo-100 rounded-2xl shadow-2xl z-[100] flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center">
        <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
          <Sparkles size={16} />
          AI Creative Suite
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-white transition">
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button 
          onClick={() => setMode('layout')}
          className={`flex-1 py-3 text-xs font-semibold transition-colors ${mode === 'layout' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Layouts
        </button>
        <button 
          onClick={() => setMode('image')}
          className={`flex-1 py-3 text-xs font-semibold transition-colors ${mode === 'image' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Magic Image
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-4">
        <p className="text-[11px] text-gray-500 leading-relaxed italic">
          {mode === 'layout' 
            ? "Generate flowcharts, mindmaps, or moodboards from text."
            : "Describe an image, and I'll generate it directly on the canvas."}
        </p>

        <div className="flex flex-col gap-2">
           <textarea
             className="w-full h-24 p-3 rounded-xl bg-indigo-50/30 border border-indigo-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-inner"
             placeholder={mode === 'layout' ? "e.g. 'Flowchart for login system'" : "e.g. 'A futuristic city at night, oil painting'"}
             value={prompt}
             onChange={(e) => setPrompt(e.target.value)}
           />
        </div>

        {mode === 'layout' && (
            <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Presets</span>
                <div className="flex flex-wrap gap-2">
                    {["Flowchart", "Mindmap", "Moodboard"].map(p => (
                        <button key={p} onClick={() => setPrompt(`Create a ${p}`)} className="text-[10px] font-bold bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-full hover:border-indigo-400 hover:text-indigo-600 transition">
                            {p}
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
            <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Utility Actions</span>
            <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => {
                    insertDesignFromAI(ydoc, viewportCenter, stageScale, 'smartAlign', {});
                    onClose();
                  }}
                  className="flex items-center gap-2 text-[11px] bg-white text-gray-700 p-2 rounded-xl hover:shadow-md transition border border-gray-100 font-semibold"
                >
                    <TerminalSquare size={14} className="text-indigo-500" />
                    Clean Board
                </button>
                <button 
                  onClick={() => {
                    insertDesignFromAI(ydoc, viewportCenter, stageScale, 'clusterStickyNotes', {});
                    onClose();
                  }}
                  className="flex items-center gap-2 text-[11px] bg-white text-gray-700 p-2 rounded-xl hover:shadow-md transition border border-gray-100 font-semibold"
                >
                    <Sparkles size={14} className="text-purple-500" />
                    Smart Cluster
                </button>
            </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50/50 border-t border-gray-100">
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 w-full"
        >
          {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Cooking...
              </>
          ) : (
              <>
                <Sparkles size={16} /> {mode === 'layout' ? "Generate Design" : "Create Image"}
              </>
          )}
        </button>
      </div>
    </div>
  );
}
