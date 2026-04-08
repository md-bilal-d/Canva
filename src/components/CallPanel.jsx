import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, AlertCircle } from 'lucide-react';
import useWebRTC from '../hooks/useWebRTC';

// Video Component for each tile
const VideoTile = ({ stream, isLocal = false, muted = false, name = "User" }) => {
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
  }, [stream]);

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

export default function CallPanel({ isOpen, onClose, socket, roomId, currentUser }) {
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
            muted={false} // DO NOT MUTE remote audio!
            name={`Participant`}
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
      </div>
    </div>
  );
}
