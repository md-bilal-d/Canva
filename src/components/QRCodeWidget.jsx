import React, { useState, useEffect } from 'react';
import { QrCode, ExternalLink, RefreshCw, Settings, X, Link as LinkIcon } from 'lucide-react';
import * as Y from 'yjs';

export default function QRCodeWidget({ shapeId, ydoc, initialUrl }) {
  const [url, setUrl] = useState(initialUrl || window.location.href);
  const [isEditing, setIsEditing] = useState(false);
  const [inputUrl, setInputUrl] = useState(url);
  const [qrSrc, setQrSrc] = useState('');

  useEffect(() => {
    // Update QR code source when URL changes
    const encoded = encodeURIComponent(url);
    setQrSrc(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`);
  }, [url]);

  useEffect(() => {
    if (!ydoc) return;
    const yShapes = ydoc.getMap('shapes');
    
    const observeHandler = () => {
      const shape = yShapes.get(shapeId);
      if (!shape) return;
      
      const data = shape instanceof Y.Map ? shape.toJSON() : shape;

      if (data.url !== undefined && data.url !== url) {
        setUrl(data.url);
        setInputUrl(data.url);
      }
    };

    yShapes.observeDeep(observeHandler);
    return () => yShapes.unobserveDeep(observeHandler);
  }, [ydoc, shapeId, url]);

  const updateYjs = (updates) => {
    if (!ydoc) return;
    const yShapes = ydoc.getMap('shapes');
    const prev = yShapes.get(shapeId);
    if (!prev) return;
    
    ydoc.transact(() => {
      yShapes.set(shapeId, { ...prev, ...updates });
    }, 'local');
  };

  const handleUrlSubmit = (e) => {
    if (e.key === 'Enter') {
      let finalUrl = inputUrl;
      if (finalUrl && !finalUrl.startsWith('http')) {
        if (!finalUrl.includes('.')) {
             // Not a URL, maybe just text?
        } else {
            finalUrl = 'https://' + finalUrl;
        }
      }
      setUrl(finalUrl);
      setIsEditing(false);
      updateYjs({ url: finalUrl });
    }
  };

  const openLink = () => {
    if (url.startsWith('http')) {
      window.open(url, '_blank');
    }
  };

  return (
    <div 
      className="w-full h-full bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden group transition-all hover:shadow-indigo-500/10"
      onPointerDown={(e) => e.stopPropagation()}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-1">
          <QrCode size={14} className="text-indigo-600" />
          {isEditing ? (
            <input 
              className="flex-1 bg-white text-[11px] px-2 py-1 rounded border border-indigo-200 text-slate-800 outline-none focus:ring-2 ring-indigo-500/20"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={handleUrlSubmit}
              onBlur={() => setIsEditing(false)}
              autoFocus
              placeholder="Paste URL or text..."
            />
          ) : (
            <div 
              className="flex-1 text-[11px] font-semibold text-slate-500 truncate cursor-text hover:text-indigo-600"
              onClick={() => setIsEditing(true)}
            >
              {url.length > 25 ? url.substring(0, 22) + '...' : url}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2">
            <button 
              onClick={openLink}
              className="p-1 hover:bg-indigo-50 rounded text-slate-400 hover:text-indigo-600 transition-colors"
              title="Open link"
            >
                <ExternalLink size={12} />
            </button>
            <button 
              onClick={() => setIsEditing(true)}
              className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
            >
                <Settings size={12} />
            </button>
        </div>
      </div>

      {/* QR Code Area */}
      <div className="flex-1 bg-white flex items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        
        <div className="relative group/qr">
            <img 
                src={qrSrc} 
                alt="QR Code" 
                className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover/qr:scale-105"
                style={{ imageRendering: 'pixelated' }}
            />
            <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover/qr:opacity-100 transition-opacity rounded-lg pointer-events-none" />
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-4 py-2 bg-indigo-600 flex items-center justify-between">
         <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[9px] text-white/90 font-bold uppercase tracking-wider">Dynamic QR Code</span>
         </div>
         <div className="flex items-center gap-1 text-[9px] text-white/70 font-medium">
            <LinkIcon size={10} />
            <span>Synced</span>
         </div>
      </div>
    </div>
  );
}
