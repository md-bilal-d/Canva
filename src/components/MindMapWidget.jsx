import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, GitCommit, GitBranch, X, Edit3, Check, MousePointer2, Network } from 'lucide-react';
import useMindMap from '../hooks/useMindMap';

export default function MindMapWidget({ shapeId, ydoc }) {
  const { nodes, connections, addNode, updateNode, deleteNode } = useMindMap(ydoc, shapeId);
  const [editingId, setEditingId] = useState(null);
  const [tempText, setTempText] = useState('');
  const containerRef = useRef(null);
  const [draggedNode, setDraggedNode] = useState(null);

  const handleEdit = (node) => {
    setEditingId(node.id);
    setTempText(node.text);
  };

  const saveEdit = () => {
    if (editingId) {
        updateNode(editingId, { text: tempText });
        setEditingId(null);
    }
  };

  const handleNodeDragStart = (id, e) => {
      e.stopPropagation();
      setDraggedNode(id);
  };

  const handleNodeDrag = (e) => {
      if (!draggedNode) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      updateNode(draggedNode, { x, y });
  };

  const stopDragging = () => setDraggedNode(null);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden font-sans relative select-none"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={draggedNode ? handleNodeDrag : undefined}
      onPointerUp={stopDragging}
      onPointerLeave={stopDragging}
    >
      {/* Header */}
      <div className="p-4 bg-slate-800/50 flex justify-between items-center shrink-0 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Network size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-100 tracking-tight uppercase">Mind Map</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Collaborative Brainstorming</p>
          </div>
        </div>
      </div>

      {/* Mind Map Canvas Area */}
      <div className="flex-1 relative overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]">
        {/* SVG Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
            </defs>
            {connections.map((conn, i) => {
                const from = nodes.find(n => n.id === conn.from);
                const to = nodes.find(n => n.id === conn.to);
                if (!from || !to) return null;
                
                const midX = (from.x + to.x) / 2;
                const midY = (from.y + to.y) / 2;
                
                // Adjust for center of widget
                const offsetW = containerRef.current?.clientWidth / 2 || 0;
                const offsetH = containerRef.current?.clientHeight / 2 || 0;

                return (
                    <path 
                        key={i}
                        d={`M ${from.x + offsetW} ${from.y + offsetH} C ${midX + offsetW} ${from.y + offsetH}, ${midX + offsetW} ${to.y + offsetH}, ${to.x + offsetW} ${to.y + offsetH}`}
                        stroke="url(#lineGrad)"
                        strokeWidth="3"
                        fill="none"
                        strokeOpacity="0.4"
                    />
                );
            })}
        </svg>

        {/* Nodes */}
        {nodes.map(node => {
            const offsetW = containerRef.current?.clientWidth / 2 || 0;
            const offsetH = containerRef.current?.clientHeight / 2 || 0;

            return (
                <motion.div
                    key={node.id}
                    layoutId={`node-${node.id}`}
                    className={`absolute flex flex-col items-center gap-2 cursor-pointer group`}
                    style={{ 
                        left: node.x + offsetW, 
                        top: node.y + offsetH,
                        transform: 'translate(-50%, -50%)',
                        zIndex: node.isRoot ? 20 : 10
                    }}
                    onPointerDown={(e) => handleNodeDragStart(node.id, e)}
                >
                    <div 
                        className={`px-4 py-2 rounded-2xl shadow-xl transition-all duration-300 border-2 flex items-center gap-2 ${
                            node.isRoot 
                            ? 'bg-indigo-600 border-indigo-400 text-white min-w-[120px] justify-center' 
                            : 'bg-slate-800 border-slate-700 text-slate-100 hover:border-emerald-500/50'
                        }`}
                    >
                        {editingId === node.id ? (
                            <input 
                                autoFocus
                                className="bg-transparent outline-none border-none text-xs font-bold w-24"
                                value={tempText}
                                onChange={e => setTempText(e.target.value)}
                                onBlur={saveEdit}
                                onKeyDown={e => e.key === 'Enter' && saveEdit()}
                            />
                        ) : (
                            <span className="text-xs font-bold whitespace-nowrap">{node.text}</span>
                        )}
                        
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); handleEdit(node); }} className="p-1 hover:text-indigo-400 transition">
                                <Edit3 size={12} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); addNode(node.id); }} className="p-1 hover:text-emerald-400 transition" title="Add Branch">
                                <Plus size={12} />
                            </button>
                            {!node.isRoot && (
                                <button onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} className="p-1 hover:text-red-400 transition">
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            );
        })}
      </div>

      {/* Help Footer */}
      <div className="p-3 bg-slate-800/30 border-t border-slate-700/50 text-center">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <MousePointer2 size={12} /> Drag to move • Click + to branch • Double click to edit
        </span>
      </div>
    </div>
  );
}
