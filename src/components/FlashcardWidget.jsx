import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, RefreshCw, Edit3, Check, BrainCircuit } from 'lucide-react';
import useFlashcards from '../hooks/useFlashcards';

export default function FlashcardWidget({ shapeId, ydoc }) {
  const { cards, addCard, deleteCard, flipCard, editCard } = useFlashcards(ydoc, shapeId);
  const [editingId, setEditingId] = useState(null);
  const [editingSide, setEditingSide] = useState(null);
  const [tempText, setTempText] = useState('');

  const startEditing = (card, side, e) => {
    e.stopPropagation();
    setEditingId(card.id);
    setEditingSide(side);
    setTempText(side === 'front' ? card.front : card.back);
  };

  const saveEdit = () => {
    if (editingId) {
      editCard(editingId, editingSide, tempText);
      setEditingId(null);
      setEditingSide(null);
    }
  };

  return (
    <div className="w-full h-full bg-slate-50 rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden font-sans select-none">
      <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">Study Deck</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Collaborative Flashcards</p>
          </div>
        </div>
        <button 
          onClick={addCard}
          className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 custom-scrollbar">
        {cards.map((card) => (
          <div key={card.id} className="relative group">
            <div 
              className="relative w-full h-48 perspective-1000 cursor-pointer"
              onClick={() => flipCard(card.id)}
            >
              <motion.div
                initial={false}
                animate={{ rotateY: card.flipped ? 180 : 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className="w-full h-full relative preserve-3d"
              >
                {/* Front */}
                <div className="absolute inset-0 backface-hidden bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                  {editingId === card.id && editingSide === 'front' ? (
                    <textarea
                      autoFocus
                      className="w-full h-full bg-transparent outline-none text-slate-800 font-bold text-lg resize-none"
                      value={tempText}
                      onChange={(e) => setTempText(e.target.value)}
                      onBlur={saveEdit}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <p className="text-lg font-bold text-slate-800">{card.front}</p>
                      <button 
                        onClick={(e) => startEditing(card, 'front', e)}
                        className="absolute bottom-4 right-4 p-2 text-slate-300 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Edit3 size={16} />
                      </button>
                    </>
                  )}
                </div>

                {/* Back */}
                <div 
                  className="absolute inset-0 backface-hidden bg-slate-900 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center rotate-y-180"
                >
                  {editingId === card.id && editingSide === 'back' ? (
                    <textarea
                      autoFocus
                      className="w-full h-full bg-transparent outline-none text-white font-bold text-lg resize-none"
                      value={tempText}
                      onChange={(e) => setTempText(e.target.value)}
                      onBlur={saveEdit}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <p className="text-lg font-bold text-white">{card.back}</p>
                      <button 
                        onClick={(e) => startEditing(card, 'back', e)}
                        className="absolute bottom-4 right-4 p-2 text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Edit3 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
            
            <button 
              onClick={() => deleteCard(card.id)}
              className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 hover:bg-red-600 z-10"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {cards.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 py-12">
            <BrainCircuit size={48} strokeWidth={1} />
            <p className="text-sm font-bold uppercase tracking-widest">No cards in this deck</p>
          </div>
        )}
      </div>

      <div className="p-3 bg-white border-t border-slate-100 text-center">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <RefreshCw size={12} /> Click card to flip • Edit with pen icon
        </span>
      </div>
    </div>
  );
}
