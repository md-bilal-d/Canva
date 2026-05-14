import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, Video, Maximize2, Settings, Link as LinkIcon, RotateCcw } from 'lucide-react';
import * as Y from 'yjs';

export default function VideoWidget({ shapeId, ydoc, initialUrl }) {
  const [url, setUrl] = useState(initialUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(0); // Progress percentage
  const [isEditing, setIsEditing] = useState(false);
  const [inputUrl, setInputUrl] = useState(url);
  const playerRef = useRef(null);
  
  // Ref to prevent feedback loops
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (!ydoc) return;
    const yShapes = ydoc.getMap('shapes');
    
    const observeHandler = () => {
      const shape = yShapes.get(shapeId);
      if (!shape) return;
      
      // We need to be careful with Y.Map vs raw object
      const data = shape instanceof Y.Map ? shape.toJSON() : shape;

      if (data.url !== undefined && data.url !== url) {
        setUrl(data.url);
        setInputUrl(data.url);
      }
      
      if (data.playing !== undefined && data.playing !== playing) {
        setPlaying(data.playing);
      }

      // If seeker moved significantly on remote, jump to it
      if (data.currentTime !== undefined && !isInternalChange.current) {
        const current = playerRef.current?.getCurrentTime() || 0;
        if (Math.abs(data.currentTime - current) > 2) {
          playerRef.current?.seekTo(data.currentTime, 'seconds');
        }
      }
    };

    yShapes.observeDeep(observeHandler);
    return () => yShapes.unobserveDeep(observeHandler);
  }, [ydoc, shapeId, url, playing]);

  const updateYjs = (updates) => {
    if (!ydoc) return;
    const yShapes = ydoc.getMap('shapes');
    const prev = yShapes.get(shapeId);
    if (!prev) return;
    
    isInternalChange.current = true;
    ydoc.transact(() => {
      yShapes.set(shapeId, { ...prev, ...updates });
    }, 'local');
    
    // Reset after a short delay to allow state to settle
    setTimeout(() => {
      isInternalChange.current = false;
    }, 100);
  };

  const handlePlayPause = () => {
    const next = !playing;
    setPlaying(next);
    updateYjs({ playing: next, currentTime: playerRef.current?.getCurrentTime() || 0 });
  };

  const handleSeek = (e) => {
    const newPlayed = parseFloat(e.target.value);
    setPlayed(newPlayed);
    playerRef.current?.seekTo(newPlayed, 'fraction');
    updateYjs({ currentTime: playerRef.current?.getDuration() * newPlayed });
  };

  const handleProgress = (state) => {
    // Only update progress locally to keep UI smooth
    setPlayed(state.played);
    
    // Periodically sync time if we are the one playing
    if (playing && Math.floor(state.playedSeconds) % 5 === 0) {
        // We don't want to spam updates, so maybe every 5 seconds
        // But for simplicity in this demo, we won't sync every second
    }
  };

  const handleUrlSubmit = (e) => {
    if (e.key === 'Enter') {
      let finalUrl = inputUrl;
      if (finalUrl && !finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;
      setUrl(finalUrl);
      setIsEditing(false);
      updateYjs({ url: finalUrl, playing: false, currentTime: 0 });
    }
  };

  return (
    <div 
      className="w-full h-full bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden group"
      onPointerDown={(e) => e.stopPropagation()}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700 transition-opacity">
        <div className="flex items-center gap-2 flex-1">
          <Video size={16} className="text-red-500" />
          {isEditing ? (
            <input 
              className="flex-1 bg-slate-900 text-xs px-2 py-1 rounded border border-slate-600 text-slate-100 outline-none focus:border-indigo-500"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={handleUrlSubmit}
              onBlur={() => setIsEditing(false)}
              autoFocus
            />
          ) : (
            <div 
              className="flex-1 text-[11px] font-medium text-slate-400 truncate cursor-text hover:text-slate-200"
              onClick={() => setIsEditing(true)}
            >
              {url}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 ml-2">
            <button className="p-1 hover:bg-slate-700 rounded text-slate-500 transition-colors">
                <Settings size={14} />
            </button>
        </div>
      </div>

      {/* Player Area */}
      <div className="flex-1 bg-black relative">
        <ReactPlayer
          ref={playerRef}
          url={url}
          playing={playing}
          width="100%"
          height="100%"
          onProgress={handleProgress}
          onPlay={() => { if (!playing) setPlaying(true); }}
          onPause={() => { if (playing) setPlaying(false); }}
          config={{
            youtube: {
                playerVars: { showinfo: 0, modestbranding: 1 }
            }
          }}
        />
        
        {/* Overlay Controls (Custom UI for better collaborative feel) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 gap-3">
            <div className="flex items-center gap-4">
                <button 
                    onClick={handlePlayPause}
                    className="w-10 h-10 flex items-center justify-center bg-indigo-600 rounded-full text-white hover:bg-indigo-500 transition-all shadow-lg scale-110"
                >
                    {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                </button>
                
                <div className="flex-1 flex flex-col gap-1">
                    <input 
                        type="range" 
                        min={0} max={0.9999} step="any"
                        value={played}
                        onMouseDown={() => setPlaying(false)}
                        onMouseUp={(e) => {
                            setPlaying(true);
                            handleSeek(e);
                        }}
                        onChange={handleSeek}
                        className="w-full accent-indigo-500 h-1 cursor-pointer appearance-none bg-slate-700 rounded-full overflow-hidden"
                    />
                </div>
                
                <button 
                    onClick={() => playerRef.current?.seekTo(0)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                    <RotateCcw size={16} />
                </button>
            </div>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="px-4 py-1.5 bg-slate-900 flex items-center justify-between">
         <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Live Sync Enabled</span>
         </div>
         <div className="text-[10px] text-slate-600 font-medium">Collaborative Media</div>
      </div>
    </div>
  );
}
