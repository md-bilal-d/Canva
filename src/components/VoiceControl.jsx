import React, { useState } from 'react';
import { Mic, MicOff, X, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useVoiceCommands from '../hooks/useVoiceCommands';

export default function VoiceControl({ 
  ydoc, 
  viewportCenter, 
  stageScale, 
  setStageScale, 
  setStagePos, 
  setTool, 
  onAIAction 
}) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [lastCommand, setLastCommand] = useState('');

  const { isListening, toggleListening, transcript } = useVoiceCommands({
    ydoc,
    viewportCenter,
    stageScale,
    setStageScale,
    setStagePos,
    setTool,
    onCommandRecognized: (cmd) => {
      if (cmd === 'open-ai') onAIAction(true);
      else if (cmd === 'close-ai') onAIAction(false);
      else {
          setLastCommand(cmd);
          setTimeout(() => setLastCommand(''), 3000);
      }
    }
  });

  return (
    <div className="fixed bottom-24 right-6 flex flex-col items-end gap-3 z-[100]">
      <AnimatePresence>
        {(isListening || lastCommand) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="bg-white/90 backdrop-blur-md border border-indigo-100 shadow-xl rounded-2xl px-4 py-2 flex items-center gap-2 max-w-xs"
          >
            <div className="flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-600 rounded-lg">
                <Command size={14} />
            </div>
            <p className="text-xs font-bold text-gray-700 truncate italic">
                {lastCommand ? `Recognized: "${lastCommand}"` : transcript || "Say a command..."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        {isListening && (
            <>
                <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-indigo-400 rounded-full"
                />
                <motion.div 
                    animate={{ scale: [1, 2, 1], opacity: [0.2, 0, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                    className="absolute inset-0 bg-indigo-300 rounded-full"
                />
            </>
        )}
        
        <button
          onClick={toggleListening}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
            isListening 
              ? 'bg-indigo-600 text-white scale-110' 
              : 'bg-white text-gray-600 hover:text-indigo-600 hover:scale-105 border border-gray-100'
          }`}
        >
          {isListening ? <Mic size={24} className="animate-pulse" /> : <MicOff size={24} />}
        </button>

        {/* Small Tooltip hint */}
        {!isListening && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                VOICE CONTROL
            </div>
        )}
      </div>
    </div>
  );
}
