import React, { useState, useEffect } from 'react';
import { Clock, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HistoryScrubber({ undoManager, canUndo, canRedo }) {
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    const update = () => {
      setHistoryCount(undoManager?.undoStack.length || 0);
    };
    undoManager?.on('stack-item-added', update);
    undoManager?.on('stack-item-popped', update);
    return () => {
      undoManager?.off('stack-item-added', update);
      undoManager?.off('stack-item-popped', update);
    };
  }, [undoManager]);

  if (historyCount === 0 && !canRedo) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[50] flex flex-col items-center gap-2">
      <div className="bg-white/90 backdrop-blur-md border border-indigo-100 rounded-2xl shadow-2xl px-4 py-2 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-2 pr-3 border-r border-gray-100">
          <Clock size={16} className="text-indigo-500" />
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">History</span>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => undoManager?.undo()}
            disabled={!canUndo}
            className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex gap-1 px-2 overflow-hidden w-48 justify-center">
            {[...Array(Math.min(historyCount, 10))].map((_, i) => (
              <div 
                key={i} 
                className={`w-1.5 h-6 rounded-full transition-all duration-300 ${i === historyCount - 1 ? 'bg-indigo-600 h-8' : 'bg-gray-200'}`} 
              />
            ))}
          </div>

          <button 
            onClick={() => undoManager?.redo()}
            disabled={!canRedo}
            className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        <button 
          onClick={() => {
              while(undoManager.canUndo()) undoManager.undo();
          }}
          className="flex items-center gap-2 text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors pl-3 border-l border-gray-100"
        >
          <RotateCcw size={14} />
          RESET
        </button>
      </div>
      <p className="text-[10px] font-medium text-gray-400 bg-white/50 px-3 py-1 rounded-full border border-gray-100/50">
        {historyCount} actions in timeline
      </p>
    </div>
  );
}
