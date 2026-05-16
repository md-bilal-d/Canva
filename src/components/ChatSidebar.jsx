import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageSquare, Trash2, User, Clock } from 'lucide-react';
import useChat from '../hooks/useChat';

export default function ChatSidebar({ ydoc, currentUser, isOpen, onClose }) {
  const { messages, sendMessage, clearChat } = useChat(ydoc, currentUser);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-20 right-4 bottom-24 w-80 bg-slate-900/90 backdrop-blur-2xl border border-slate-700/50 rounded-3xl shadow-2xl z-[1000] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-100 tracking-tight uppercase">Board Chat</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Team Sync</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={clearChat}
                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                title="Clear Chat"
              >
                <Trash2 size={16} />
              </button>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 opacity-50">
                <MessageSquare size={40} strokeWidth={1} />
                <p className="text-xs font-bold uppercase tracking-widest">No messages yet</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${msg.sender === currentUser.name ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: msg.senderColor }}>
                      {msg.sender}
                    </span>
                    <span className="text-[8px] text-slate-500 font-bold">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div 
                    className={`px-4 py-2 rounded-2xl text-sm max-w-[90%] break-words shadow-sm ${
                      msg.sender === currentUser.name 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/50'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-700/50 bg-slate-800/20">
            <form onSubmit={handleSend} className="relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Message the team..."
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-3 pl-4 pr-12 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="absolute right-2 top-1.5 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
