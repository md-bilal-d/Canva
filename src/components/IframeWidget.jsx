import React, { useState } from 'react';
import { Globe, RefreshCw } from 'lucide-react';

export default function IframeWidget({ shapeId, ydoc, initialUrl }) {
    const [url, setUrl] = useState(initialUrl || 'https://en.wikipedia.org/wiki/Main_Page');
    const [inputUrl, setInputUrl] = useState(url);
    const [isEditing, setIsEditing] = useState(false);

    const handleSave = () => {
        let finalUrl = inputUrl;
        if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;
        setUrl(finalUrl);
        setIsEditing(false);

        if (!ydoc) return;
        const yShapes = ydoc.getMap('shapes');
        const shape = yShapes.get(shapeId);
        if (shape) {
            yShapes.doc.transact(() => {
                yShapes.set(shapeId, { ...shape, url: finalUrl });
            }, 'local');
        }
    };

    return (
        <div 
            className="w-full h-full bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden"
            onPointerDown={(e) => e.stopPropagation()} // Prevent dragging board when interacting
            style={{ pointerEvents: 'auto' }}
        >
            <div className="flex items-center justify-between p-2 bg-gray-100 border-b border-gray-200 cursor-move" onPointerDown={e => e.preventDefault()}>
                <div className="flex items-center gap-2 flex-1">
                    <Globe size={14} className="text-gray-500" />
                    {isEditing ? (
                        <input 
                            className="flex-1 text-xs px-2 py-0.5 border rounded outline-none"
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave();
                            }}
                            autoFocus
                        />
                    ) : (
                        <div 
                            className="flex-1 text-xs text-gray-600 truncate cursor-text"
                            onClick={() => setIsEditing(true)}
                        >
                            {url}
                        </div>
                    )}
                </div>
                <button 
                    onClick={() => {
                        // Force refresh iframe by resetting url briefly
                        const current = url;
                        setUrl('');
                        setTimeout(() => setUrl(current), 50);
                    }}
                    className="p-1 hover:bg-gray-200 rounded text-gray-500 ml-2"
                    title="Refresh"
                >
                    <RefreshCw size={14} />
                </button>
            </div>
            
            <div className="flex-1 bg-gray-50 relative pointer-events-auto">
                {url ? (
                    <iframe 
                        src={url}
                        className="w-full h-full border-none"
                        title="Web Portal"
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                        Loading...
                    </div>
                )}
            </div>
        </div>
    );
}
