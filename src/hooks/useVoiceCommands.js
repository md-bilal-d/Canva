import { useState, useEffect, useCallback, useRef } from 'react';
import { insertDesignFromAI } from '../utils/AIDispatcher';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function useVoiceCommands({ 
  ydoc, 
  viewportCenter, 
  stageScale, 
  setStageScale, 
  setStagePos, 
  setTool, 
  onCommandRecognized 
}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          handleCommand(event.results[i][0].transcript.toLowerCase().trim());
        }
      }
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        recognition.start(); // Keep listening if we didn't explicitly stop
      }
    };

    recognitionRef.current = recognition;
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript('Listening...');
    }
  }, [isListening]);

  const handleCommand = (cmd) => {
    console.log('[VOICE] Recognized:', cmd);
    if (onCommandRecognized) onCommandRecognized(cmd);

    // 1. ADD STICKY NOTE
    if (cmd.includes('add sticky') || cmd.includes('create note')) {
      const text = cmd.replace(/add sticky|create note/g, '').replace('note', '').trim();
      insertDesignFromAI(ydoc, viewportCenter, stageScale, 'moodboard', { keywords: [text || 'New Note'] });
      return;
    }

    // 2. ZOOM CONTROLS
    if (cmd.includes('zoom in')) {
      setStageScale(prev => Math.min(prev * 1.2, 5));
      return;
    }
    if (cmd.includes('zoom out')) {
      setStageScale(prev => Math.max(prev / 1.2, 0.1));
      return;
    }
    if (cmd.includes('reset zoom') || cmd.includes('zoom reset')) {
      setStageScale(1);
      setStagePos({ x: 0, y: 0 });
      return;
    }

    // 3. TOOL SWITCHING
    if (cmd.includes('switch to pen') || cmd.includes('select pen')) {
      setTool('pen');
      return;
    }
    if (cmd.includes('switch to select') || cmd.includes('select tool')) {
      setTool('select');
      return;
    }
    if (cmd.includes('switch to rectangle') || cmd.includes('draw rectangle')) {
      setTool('rect');
      return;
    }
    if (cmd.includes('switch to circle') || cmd.includes('draw circle')) {
      setTool('circle');
      return;
    }

    // 4. MISC
    if (cmd.includes('clear canvas') || cmd.includes('erase everything')) {
      insertDesignFromAI(ydoc, viewportCenter, stageScale, 'clear', {});
      return;
    }
    if (cmd.includes('open ai') || cmd.includes('show ai')) {
      // We can handle this by passing a setter
      onCommandRecognized('open-ai');
      return;
    }
    if (cmd.includes('close ai') || cmd.includes('hide ai')) {
      onCommandRecognized('close-ai');
      return;
    }
  };

  return { isListening, toggleListening, transcript };
}
