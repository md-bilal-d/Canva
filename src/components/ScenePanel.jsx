import React, { useState } from 'react';
import { Presentation, Plus, Trash2, Play, Pause, ChevronRight, X, Camera, Map as MapIcon, User } from 'lucide-react';
import useScenes from '../hooks/useScenes';

export default function ScenePanel({ isOpen, onClose, ydoc, stagePos, stageScale, onTransitionTo, shapes, followUserId, remoteCursors }) {
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

  const handlePlayFrame = (frame) => {
    onTransitionTo({
        x: window.innerWidth / 2 - frame.x * frame.scale, // simplified transition logic
        y: window.innerHeight / 2 - frame.y * frame.scale,
        scale: frame.scale || 1
    });
  };

  const frames = React.useMemo(() => {
    return Object.entries(shapes || {})
        .filter(([_, s]) => s.type === 'frame')
        .map(([id, s]) => ({ id, ...s }));
  }, [shapes]);

  const leader = remoteCursors?.[followUserId];

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

      {/* Scenes & Frames List */}
      <div className="flex-1 overflow-y-auto max-h-80 p-2 flex flex-col gap-4">
        {/* Presenter Follow Status */}
        {followUserId && leader && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-col gap-2 animate-pulse-slow">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                    <User size={14} /> Following {leader.name}
                </div>
                <div className="text-[10px] text-blue-600 font-medium">Your camera is synced with the presenter.</div>
            </div>
        )}

        {/* Frames Section */}
        {frames.length > 0 && (
            <div className="flex flex-col gap-1">
                <div className="px-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <MapIcon size={10} /> Frames
                </div>
                {frames.map((frame) => (
                    <div 
                        key={frame.id}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/50 border border-transparent hover:border-blue-100 transition group cursor-pointer"
                        onClick={() => onTransitionTo({
                            x: window.innerWidth / 2 - (frame.x + frame.width / 2) * (window.innerWidth / (frame.width * 1.2)),
                            y: window.innerHeight / 2 - (frame.y + frame.height / 2) * (window.innerWidth / (frame.width * 1.2)),
                            scale: window.innerWidth / (frame.width * 1.2)
                        })}
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition">
                                <Camera size={14} />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">{frame.name}</span>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* Captured Scenes Section */}
        <div className="flex flex-col gap-1">
            <div className="px-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Presentation size={10} /> Saved Views
            </div>
            {scenes.length === 0 && frames.length === 0 && (
                <div className="text-center text-xs text-gray-400 py-4 italic">No scenes or frames yet.</div>
            )}
            {scenes.map((scene, index) => (
                <div 
                    key={scene.id} 
                    className={`flex items-center justify-between p-2.5 rounded-xl transition ${
                        isPlaying && currentIndex === index ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
                    }`}
                    onClick={() => handlePlayScene(index)}
                >
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPlaying && currentIndex === index ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                            {index + 1}
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{scene.name}</span>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); removeScene(index); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Delete Scene"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
        </div>
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
