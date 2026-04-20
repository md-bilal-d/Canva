// ============================================================
// PollWidget — Collaborative voting/polling widget
// ============================================================

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, BarChart3, Check, EyeOff, Loader2, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function PollCreationModal({ onClose, onCreate }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [timerMinutes, setTimerMinutes] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  const addOption = () => {
    if (options.length < 6) setOptions([...options, '']);
  };

  const updateOption = (i, val) => {
    const next = [...options];
    next[i] = val;
    setOptions(next);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const validOptions = options.filter((o) => o.trim());
    if (!question.trim() || validOptions.length < 2) return;
    onCreate({
      question: question.trim(),
      options: validOptions,
      timerMinutes: timerMinutes ? Number(timerMinutes) : null,
      anonymous,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[10000] flex items-center justify-center p-4" onClick={onClose}>
      <motion.form
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onSubmit={handleCreate}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-4 border border-indigo-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 size={20} className="text-indigo-600" />
            Create Poll
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Question</label>
          <input
            autoFocus
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What's your question?"
            className="w-full p-3 bg-indigo-50/30 border border-indigo-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Options</label>
          <div className="flex flex-col gap-2">
              {options.map((opt, i) => (
                <input
                  key={i}
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300"
                />
              ))}
          </div>
          {options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              className="text-[11px] font-bold text-indigo-500 hover:text-indigo-600 transition flex items-center gap-1 mt-1"
            >
              + Add another option
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
           <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Duration (min)</label>
                <input
                    type="number"
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(e.target.value)}
                    placeholder="None"
                    className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none"
                />
           </div>
           <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                        type="checkbox" 
                        checked={anonymous} 
                        onChange={(e) => setAnonymous(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">Anonymous</span>
                </label>
           </div>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2 mt-2"
        >
          Launch Poll
        </button>
      </motion.form>
    </div>
  );
}

export default function PollWidget({
  poll,
  currentUserId,
  onVote,
  onClose,
  getTotalVotes,
  getVoteCount
}) {
  if (!poll) return null;

  const totalVotes = getTotalVotes?.(poll) || 0;
  const userVote = poll.votes?.[currentUserId];
  const isClosed = poll.closed;

  // Find winner
  let winnerId = null;
  if (isClosed && poll.options?.length > 0) {
    let max = -1;
    poll.options.forEach(opt => {
        const count = getVoteCount?.(poll, opt.id) || 0;
        if (count > max) {
            max = count;
            winnerId = opt.id;
        }
    });
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed z-[8000] w-[320px] glass-panel rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ left: poll.x || 200, top: poll.y || 200 }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200/50 flex justify-between items-center bg-white/40">
        <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-indigo-600" />
            <span className="text-[12px] font-bold text-gray-800 uppercase tracking-wider">Board Poll</span>
            {poll.anonymous && <EyeOff size={12} className="text-gray-400" />}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full text-gray-400 transition-colors">
            <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
             <h4 className="text-sm font-bold text-gray-900 leading-tight">{poll.question}</h4>
             {isClosed && <span className="text-[10px] font-bold text-green-600 uppercase flex items-center gap-1"><Check size={10} /> Final Results</span>}
          </div>

          <div className="flex flex-col gap-2">
            {poll.options.map((opt) => {
                const count = getVoteCount?.(poll, opt.id) || 0;
                const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                const isSelected = userVote === opt.id;
                const isWinner = isClosed && opt.id === winnerId;

                return (
                    <motion.button
                        key={opt.id}
                        whileHover={!isClosed ? { scale: 1.02 } : {}}
                        whileTap={!isClosed ? { scale: 0.98 } : {}}
                        onClick={() => !isClosed && onVote?.(poll.id, opt.id)}
                        disabled={isClosed}
                        className={`relative w-full p-3 rounded-xl border transition-all text-left group overflow-hidden ${
                            isSelected ? 'border-indigo-500 bg-indigo-50/20' : 
                            isWinner ? 'border-green-500 bg-green-50/20' :
                            'border-gray-100 hover:border-gray-200 bg-gray-50/30'
                        }`}
                    >
                        {/* Dynamic Progress Bar */}
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`absolute inset-y-0 left-0 opacity-10 ${
                                isWinner ? 'bg-green-500' : isSelected ? 'bg-indigo-500' : 'bg-gray-400'
                            }`}
                        />

                        <div className="relative flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                {isSelected && <Check size={14} className="text-indigo-600" />}
                                {isWinner && <Trophy size={14} className="text-green-600" />}
                                <span className={`text-xs font-semibold ${isSelected ? 'text-indigo-700' : isWinner ? 'text-green-700' : 'text-gray-700'}`}>
                                    {opt.text}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-600">
                                {Math.round(pct)}%
                            </span>
                        </div>
                    </motion.button>
                );
            })}
          </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-white/40 border-t border-gray-200/50 flex justify-between items-center">
         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
            {totalVotes} Total Votes
         </span>
         {!isClosed && <div className="flex items-center gap-1 text-[10px] text-indigo-500 font-bold"><Loader2 size={10} className="animate-spin" /> Live</div>}
      </div>
    </motion.div>
  );
}

export { PollCreationModal };
al };
