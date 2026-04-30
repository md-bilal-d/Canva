import React from 'react';
import { Layers, Eye, EyeOff, Lock, Unlock, ChevronUp, ChevronDown, Trash2, Box, StickyNote, Image as ImageIcon, Type } from 'lucide-react';

export default function LayersPanel({ isOpen, onClose, shapes, stickyNotes, selectedId, onSelect, ydoc }) {
  if (!isOpen) return null;

  const allItems = [
    ...Object.entries(shapes).map(([id, s]) => ({ id, ...s, itemType: 'shape' })),
    ...Object.entries(stickyNotes).map(([id, n]) => ({ 
        id, 
        itemType: 'note', 
        type: 'note',
        name: n.get('textContent').toString().substring(0, 20) || 'Sticky Note',
        x: n.get('x'),
        y: n.get('y')
    }))
  ].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  const updateZIndex = (id, delta, itemType) => {
    const yMap = itemType === 'shape' ? ydoc.getMap('shapes') : ydoc.getMap('stickyNotes');
    const item = yMap.get(id);
    if (!item) return;

    ydoc.transact(() => {
        if (itemType === 'shape') {
            yMap.set(id, { ...item, zIndex: (item.zIndex || 0) + delta });
        } else {
            // For Y.Map notes, we set a property
            item.set('zIndex', (item.get('zIndex') || 0) + delta);
        }
    }, 'local');
  };

  const toggleVisibility = (id, itemType) => {
    const yMap = itemType === 'shape' ? ydoc.getMap('shapes') : ydoc.getMap('stickyNotes');
    const item = yMap.get(id);
    if (!item) return;

    ydoc.transact(() => {
        if (itemType === 'shape') {
            yMap.set(id, { ...item, visible: item.visible === false });
        } else {
            item.set('visible', item.get('visible') === false);
        }
    }, 'local');
  };

  const toggleLock = (id, itemType) => {
    const yMap = itemType === 'shape' ? ydoc.getMap('shapes') : ydoc.getMap('stickyNotes');
    const item = yMap.get(id);
    if (!item) return;

    ydoc.transact(() => {
        if (itemType === 'shape') {
            yMap.set(id, { ...item, locked: !item.locked });
        } else {
            item.set('locked', !item.get('locked'));
        }
    }, 'local');
  };

  const moveToExtreme = (id, direction, itemType) => {
    const yMap = itemType === 'shape' ? ydoc.getMap('shapes') : ydoc.getMap('stickyNotes');
    const item = yMap.get(id);
    if (!item) return;

    const zIndexes = allItems.map(i => i.zIndex || 0);
    const extreme = direction === 'front' ? Math.max(...zIndexes, 0) + 1 : Math.min(...zIndexes, 0) - 1;

    ydoc.transact(() => {
        if (itemType === 'shape') {
            yMap.set(id, { ...item, zIndex: extreme });
        } else {
            item.set('zIndex', extreme);
        }
    }, 'local');
  };

  const getIcon = (type) => {
    switch (type) {
      case 'rect': return <Box size={14} />;
      case 'circle': return <Box size={14} className="rounded-full" />;
      case 'image': return <ImageIcon size={14} />;
      case 'text': return <Type size={14} />;
      case 'note': return <StickyNote size={14} />;
      default: return <Box size={14} />;
    }
  };

  return (
    <div className="absolute left-6 top-20 w-72 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl z-[1001] flex flex-col overflow-hidden animate-in slide-in-from-left-4 duration-300">
      <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
          <Layers size={16} className="text-indigo-600" />
          Layer Management
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-400 transition">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[60vh] p-2 flex flex-col gap-1">
        {allItems.reverse().map((item) => (
          <div 
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`group flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer ${
                selectedId === item.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'hover:bg-gray-50 border-transparent'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${selectedId === item.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {getIcon(item.type)}
            </div>
            
            <div className="flex-1 min-w-0">
                <div className={`text-[11px] font-bold truncate ${selectedId === item.id ? 'text-indigo-900' : 'text-gray-700'}`}>
                    {item.name || item.label || item.type || 'Unnamed Layer'}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded">Z: {item.zIndex || 0}</span>
                    {item.locked && <Lock size={10} className="text-amber-500" />}
                    {item.visible === false && <EyeOff size={10} className="text-red-400" />}
                </div>
            </div>

            <div className={`flex items-center gap-1 transition-opacity ${selectedId === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <div className="flex flex-col">
                    <button 
                        onClick={(e) => { e.stopPropagation(); moveToExtreme(item.id, 'front', item.itemType); }}
                        className="p-0.5 hover:bg-white rounded text-gray-300 hover:text-indigo-600"
                        title="Bring to Front"
                    >
                        <ChevronUp size={10} strokeWidth={3} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); moveToExtreme(item.id, 'back', item.itemType); }}
                        className="p-0.5 hover:bg-white rounded text-gray-300 hover:text-indigo-600"
                        title="Send to Back"
                    >
                        <ChevronDown size={10} strokeWidth={3} />
                    </button>
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); toggleLock(item.id, item.itemType); }}
                    className={`p-1.5 hover:bg-white rounded ${item.locked ? 'text-amber-500' : 'text-gray-400 hover:text-amber-600'}`}
                >
                    {item.locked ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); toggleVisibility(item.id, item.itemType); }}
                    className={`p-1.5 hover:bg-white rounded ${item.visible === false ? 'text-red-500' : 'text-gray-400 hover:text-indigo-600'}`}
                >
                    {item.visible === false ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
            </div>
          </div>
        ))}
        {allItems.length === 0 && (
            <div className="p-8 text-center text-xs text-gray-400 italic">No layers yet.</div>
        )}
      </div>

      <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{allItems.length} Objects</span>
      </div>
    </div>
  );
}

function X({ size }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>; }
