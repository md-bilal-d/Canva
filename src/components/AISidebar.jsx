import React, { useState } from 'react';
import { Sparkles, TerminalSquare, Send, X, Loader2 } from 'lucide-react';
import { insertDesignFromAI } from '../utils/AIDispatcher';
import * as Y from 'yjs';

window.Y = Y; // Make Y available for AIDispatcher.js to avoid double importing issues

export default function AISidebar({ isOpen, onClose, ydoc, viewportCenter, stageScale }) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = () => {
    if (!prompt.trim() || !ydoc) return;
    
    setIsGenerating(true);
    
    // Simulate AI processing delay based on prompt
    setTimeout(() => {
        const lower = prompt.toLowerCase();
        let intent = 'moodboard';
        let params = {};

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
        
        setIsGenerating(false);
        setPrompt('');
        onClose();
    }, 1500);
  };

  return (
    <div className="absolute right-6 top-6 w-80 bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-[100] flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-indigo-100/50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
          <Sparkles size={16} className="text-indigo-600" />
          AI Design Assistant
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full text-gray-500 transition">
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-4">
        <p className="text-xs text-gray-500 leading-relaxed">
          Describe the layout you want to build. I'll generate the shapes, colors, and notes instantly onto your canvas.
        </p>

        <div className="flex flex-col gap-2">
           <textarea
             className="w-full h-28 p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none placeholder:text-gray-400 text-gray-700"
             placeholder="e.g. 'Create a flowchart with 4 steps' or 'Draw a mindmap about launching an app'"
             value={prompt}
             onChange={(e) => setPrompt(e.target.value)}
             onKeyDown={(e) => {
                 if (e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     handleGenerate();
                 }
             }}
           />
        </div>

        <div className="flex flex-col gap-2">
            <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">Suggestions</span>
            <div className="flex flex-wrap gap-2">
                <button onClick={() => setPrompt("Create a 4-step flowchart")} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition whitespace-nowrap">
                    Flowchart
                </button>
                <button onClick={() => setPrompt("Brainstorming mindmap")} className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded-full hover:bg-purple-100 transition whitespace-nowrap">
                    Mindmap
                </button>
                <button onClick={() => setPrompt("Create a moodboard")} className="text-xs bg-pink-50 text-pink-600 px-3 py-1.5 rounded-full hover:bg-pink-100 transition whitespace-nowrap">
                    Moodboard
                </button>
            </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium shadow-md hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full"
        >
          {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Generating...
              </>
          ) : (
              <>
                <Send size={16} /> Generate Layout
              </>
          )}
        </button>
      </div>
    </div>
  );
}
