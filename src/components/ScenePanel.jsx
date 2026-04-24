import React, { useState } from 'react';
import { Presentation, Plus, Trash2, Play, Pause, ChevronRight, X } from 'lucide-react';
import useScenes from '../hooks/useScenes';

export default function ScenePanel({ isOpen, onClose, ydoc, stagePos, stageScale, onTransitionTo }) {
  const { scenes, addScene, removeScene } = useScenes(ydoc);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen) return null;

  const handleCapture = () => {
    addScene(`Scene ${scenes.length + 1}`, stagePos.x, stagePos.y, stageScale);
  };

  const handlePlayScene = (index) => {
    if (scenes[index]) {
      setCurrentIndex(index);
      onTransitionTo(scenes[index]);
    }
  };

  const [autoPlay, setAutoPlay] = useState(false);

  React.useEffect(() => {
    let timer;
    if (isPlaying && autoPlay) {
      timer = setTimeout(() => {
        nextScene();
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, autoPlay, currentIndex, scenes.length]);

  const togglePresentation = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setAutoPlay(false);
    } else {
      setIsPlaying(true);
      if (scenes.length > 0) {
        handlePlayScene(0);
      }
    }
  };

  const nextScene = () => {
    if (currentIndex < scenes.length - 1) {
      handlePlayScene(currentIndex + 1);
    } else {
      setIsPlaying(false); // End of presentation
      setAutoPlay(false);
    }
  };

  return (
    <div className="absolute left-20 top-1/2 -translate-y-1/2 w-64 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl z-[100] flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-4">
      {/* Header */}
      <div className="p-3 border-b flex justify-between items-center bg-gray-50/50">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
          <Presentation size={16} className="text-blue-600" />
          Scenes
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-500">
          <X size={14} />
        </button>
      </div>

      {/* Action Bar */}
      <div className="p-2 flex gap-2 border-b border-gray-100 bg-white">
        <button 
          onClick={handleCapture}
          className="flex-1 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-lg text-xs font-medium transition"
        >
          <Plus size={14} /> Capture View
        </button>
        <button 
          onClick={togglePresentation}
          disabled={scenes.length === 0}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition ${
             isPlaying ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
          }`}
        >
          {isPlaying ? <><Pause size={14} /> Stop</> : <><Play size={14} /> Present</>}
        </button>
      </div>

      {/* Scenes List */}
      <div className="flex-1 overflow-y-auto max-h-64 p-2 flex flex-col gap-1">
        {scenes.length === 0 && (
          <div className="text-center text-xs text-gray-400 py-4">No scenes captured yet.</div>
        )}
        {scenes.map((scene, index) => (
          <div 
             key={scene.id} 
             className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                 isPlaying && currentIndex === index ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
             }`}
             onClick={() => handlePlayScene(index)}
          >
            <span className="text-sm text-gray-700 font-medium">{scene.name}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); removeScene(index); }}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
              title="Delete Scene"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Presentation Controls overlay when playing */}
      {isPlaying && (
         <div className="p-2 bg-blue-600 text-white flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <span className="text-xs font-medium px-2">Scene {currentIndex + 1} / {scenes.length}</span>
                <button onClick={nextScene} className="flex items-center gap-1 text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1 rounded">
                   Next <ChevronRight size={14} />
                </button>
            </div>
            <div className="flex justify-between items-center px-2">
                <label className="text-xs flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={autoPlay} onChange={(e) => setAutoPlay(e.target.checked)} className="rounded text-blue-500 focus:ring-blue-500 bg-white/20 border-transparent" />
                    Auto-Play (3s)
                </label>
            </div>
         </div>
      )}
    </div>
  );
}
