import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, AlertCircle, StickyNote, Loader2 } from 'lucide-react';
import useWebRTC from '../hooks/useWebRTC';
import * as Y from 'yjs';
import { insertDesignFromAI } from '../utils/AIDispatcher.js';

// Video Component for each tile
const VideoTile = ({ stream, isLocal = false, muted = false, name = "User", remoteUserId, remoteCursors, stageScale, localCursor }) => {
  const videoRef = useRef();
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.error("Video play error:", err);
      });
    }

    // Audio Analysis for "Speaking" indicator
    if (stream && stream.getAudioTracks().length > 0) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        dataArrayRef.current = dataArray;

        const checkAudio = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          
          let sum = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            sum += dataArrayRef.current[i];
          }
          const average = sum / dataArrayRef.current.length;
          
          // Threshold for speaking
          if (average > 30) {
            setIsSpeaking(true);
          } else {
            setIsSpeaking(false);
          }
          
          // --- SPATIAL AUDIO LOGIC ---
          if (!isLocal && remoteUserId && remoteCursors && localCursor && videoRef.current) {
            const remoteCursor = remoteCursors[remoteUserId];
            if (remoteCursor) {
                const dx = remoteCursor.x - localCursor.x;
                const dy = remoteCursor.y - localCursor.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Volume falloff: 1.0 at 0 distance, 0.1 at 2000 units
                let volume = 1 - (distance / 2000);
                volume = Math.max(0.1, Math.min(1, volume));
                videoRef.current.volume = volume;
            }
          }

          animationRef.current = requestAnimationFrame(checkAudio);
        };

        checkAudio();
      } catch (e) {
        console.error("Audio Context error", e);
      }
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, [stream, remoteUserId, remoteCursors, localCursor]);

  return (
    <div className={`relative flex flex-col items-center justify-center bg-gray-900 rounded-xl overflow-hidden shadow-sm aspect-video ${isSpeaking ? 'ring-2 ring-green-500' : 'ring-1 ring-gray-800'}`}>
      {stream && stream.getVideoTracks().length > 0 ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="w-full h-full object-cover"
          style={{ transform: isLocal ? 'scaleX(-1)' : 'none' }} // mirror local video
        />
      ) : (
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 font-bold text-xl mb-2">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      
      {/* Name Label */}
      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded truncate max-w-[90%]">
        {name} {isLocal && "(You)"}
      </div>
      
      {/* Speaking Indicator Badge (Optional, since we have the ring) */}
      {isSpeaking && (
         <div className="absolute top-2 right-2 flex space-x-1">
           <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
           <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
           <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
         </div>
      )}
    </div>
  );
};

export default function CallPanel({ isOpen, onClose, socket, roomId, currentUser, ydoc, remoteCursors, stageScale, viewportCenter }) {
  const {
    localStream,
    remoteStreams,
    micEnabled,
    cameraEnabled,
    errorMsg,
    toggleMic,
    toggleCamera,
    leaveCall
  } = useWebRTC(socket, roomId, isOpen, currentUser);

  const [isTranscribing, setIsTranscribing] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      if (transcript.trim() && ydoc) {
        const text = transcript.trim().toLowerCase();
        
        // Voice Command Parsing
        const viewportCenter = arguments[0].viewportCenter || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        
        if (text.startsWith('hey canva') || text.startsWith('canva')) {
           const command = text.replace(/^(hey )?canva\s*/, '');
           
           if (command.includes('clear board') || command.includes('clear the board')) {
               insertDesignFromAI(ydoc, viewportCenter, 1, 'clear', {});
           } else if (command.includes('mind map') || command.includes('mindmap')) {
               insertDesignFromAI(ydoc, viewportCenter, 1, 'mindmap', { topic: 'Voice Mindmap' });
           } else if (command.includes('flowchart') || command.includes('flow chart')) {
               insertDesignFromAI(ydoc, viewportCenter, 1, 'flowchart', {});
           } else if (command.includes('summarize')) {
               insertDesignFromAI(ydoc, viewportCenter, 1, 'summarize', {});
           } else if (command.includes('smart align') || command.includes('align notes')) {
               insertDesignFromAI(ydoc, viewportCenter, 1, 'smartAlign', {});
           } else {
               // Fallback: cluster
               insertDesignFromAI(ydoc, viewportCenter, 1, 'clusterStickyNotes', {});
           }
           return; // Stop here, don't make a sticky note
        }

        // Standard dictation -> Sticky Note
        const id = 'note-voice-' + Date.now();
        const yNotes = ydoc.getMap('stickyNotes');
        ydoc.transact(() => {
          const noteMap = new Y.Map();
          noteMap.set('id', id);
          noteMap.set('x', viewportCenter.x + (Math.random() - 0.5) * 200);
          noteMap.set('y', viewportCenter.y + (Math.random() - 0.5) * 200);
          noteMap.set('backgroundColor', '#fbcfe8'); // Pink for voice notes
          const yText = new Y.Text();
          yText.insert(0, transcript.trim());
          noteMap.set('textContent', yText);
          yNotes.set(id, noteMap);
        }, 'local');
      }
    };

    recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        setIsTranscribing(false);
    };

    recognition.onend = () => {
        if (isTranscribing) recognition.start(); // Keep listening if toggle is on
    };

    recognitionRef.current = recognition;

    return () => {
        if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [ydoc, isTranscribing]);

  const toggleTranscription = () => {
    if (!recognitionRef.current) return;
    const nextState = !isTranscribing;
    setIsTranscribing(nextState);
    if (nextState) {
        recognitionRef.current.start();
    } else {
        recognitionRef.current.stop();
    }
  };

  if (!isOpen) return null;

  const handleHangUp = () => {
    leaveCall();
    onClose();
  };

  return (
    <div className="absolute top-20 right-6 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col z-[10000] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/50">
        <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          Voice & Video Call
        </h3>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-600 text-xs flex items-start gap-2 border-b border-red-100">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* Video Grid */}
      <div className="p-3 flex-1 overflow-y-auto max-h-[60vh] flex flex-col gap-3 bg-gray-50">
        
        {/* Local Video */}
        <VideoTile 
          stream={localStream} 
          isLocal={true} 
          muted={true} // always mute local audio to prevent feedback loop
          name={currentUser?.name || "You"} 
        />
        
        {/* Remote Videos */}
        {Object.entries(remoteStreams).map(([userId, stream]) => (
          <VideoTile
            key={userId}
            stream={stream}
            isLocal={false}
            muted={false}
            name={`Participant`}
            remoteUserId={userId}
            remoteCursors={remoteCursors}
            stageScale={stageScale}
            localCursor={viewportCenter}
          />
        ))}

        {Object.keys(remoteStreams).length === 0 && !errorMsg && (
          <div className="text-center text-xs text-gray-400 py-4 italic">
            Waiting for others to join...
          </div>
        )}
      </div>

      {/* Controls Footer */}
      <div className="p-3 flex items-center justify-center gap-3 border-t border-gray-100 bg-white">
        <button
          onClick={toggleMic}
          className={`p-3 rounded-full flex items-center justify-center transition-colors ${
            micEnabled ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-red-100 hover:bg-red-200 text-red-600'
          }`}
          title={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
        >
          {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        
        <button
          onClick={toggleCamera}
          className={`p-3 rounded-full flex items-center justify-center transition-colors ${
            cameraEnabled ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-red-100 hover:bg-red-200 text-red-600'
          }`}
          title={cameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
        >
          {cameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        <button
          onClick={handleHangUp}
          className="p-3 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-colors shadow-sm ml-2"
          title="Leave Call"
        >
          <PhoneOff size={20} />
        </button>

        <button
          onClick={toggleTranscription}
          className={`p-3 rounded-full flex items-center justify-center transition-all ${
            isTranscribing ? 'bg-pink-100 text-pink-600 ring-2 ring-pink-400' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          title={isTranscribing ? "Stop Dictation" : "Dictate to Board"}
        >
          {isTranscribing ? <Loader2 size={20} className="animate-spin" /> : <StickyNote size={20} />}
        </button>
      </div>
    </div>
  );
}
