import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'simple-peer';

const PEER_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export default function useWebRTC(socket, roomId, inCall) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: stream }
  const [errorMsg, setErrorMsg] = useState(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  
  const peersRef = useRef({}); // { socketId: Peer }
  const localStreamRef = useRef(null);

  const leaveCall = useCallback(() => {
    // 1. Destroy all peers
    Object.values(peersRef.current).forEach(peer => {
      try { peer.destroy(); } catch (e) { /* ignore */ }
    });
    peersRef.current = {};
    
    // 2. Stop local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // 3. Clear states
    setLocalStream(null);
    setRemoteStreams({});
    setMicEnabled(true);
    setCameraEnabled(true);
    setErrorMsg(null);

    // 4. Tell server we left
    if (socket) {
      socket.emit('call-leave');
    }
  }, [socket]);

  // Main Effect to manage call media and connection
  useEffect(() => {
    if (!inCall || !socket) return;
    let isSubscribed = true;

    async function initMediaAndJoin() {
      let stream = null;
      try {
        // Try Video + Audio first
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (err1) {
        console.warn("Video+Audio failed, trying Audio only", err1);
        try {
          // Fallback to Audio only
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        } catch (err2) {
          console.error("Audio fallback failed", err2);
          if (isSubscribed) {
            setErrorMsg("Camera/Mic permission denied. Please allow access in your browser settings.");
          }
          return; // Stop here if no media
        }
      }

      if (!isSubscribed) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Tell server we joined
      socket.emit('call-join', { roomId });
    }

    initMediaAndJoin();

    // Helper: Create a SimplePeer instance
    const createPeer = (targetSocketId, initiator) => {
      const peer = new Peer({
        initiator,
        trickle: true,
        stream: localStreamRef.current,
        config: PEER_CONFIG
      });

      peer.on('signal', signal => {
        socket.emit('call-signal', { to: targetSocketId, signal });
      });

      peer.on('stream', remoteStream => {
        setRemoteStreams(prev => ({ ...prev, [targetSocketId]: remoteStream }));
      });

      peer.on('error', err => {
        console.warn(`[WebRTC] Peer error for ${targetSocketId}:`, err);
        removePeer(targetSocketId);
      });

      peer.on('close', () => {
        removePeer(targetSocketId);
      });

      return peer;
    };

    const removePeer = (socketId) => {
      if (peersRef.current[socketId]) {
        try { peersRef.current[socketId].destroy(); } catch (e) { /* ignore */ }
        const prevPeers = { ...peersRef.current };
        delete prevPeers[socketId];
        peersRef.current = prevPeers;
      }
      setRemoteStreams(prev => {
        const updated = { ...prev };
        delete updated[socketId];
        return updated;
      });
    };

    // Socket Event: A new user joined the room
    const handleUserJoined = ({ callerId }) => {
      console.log(`[WebRTC] Ext user ${callerId} joined. I am initiating peer connection.`);
      // I am already in the room, so I initiate the connection to the new user
      const peer = createPeer(callerId, true);
      peersRef.current[callerId] = peer;
    };

    // Socket Event: Receive a signal (offer, answer, or ICE candidate)
    const handleSignal = ({ callerId, signal }) => {
      let peer = peersRef.current[callerId];

      if (!peer) {
        console.log(`[WebRTC] Received signal from new user ${callerId}. Accepting as receiver.`);
        // Peer doesn't exist, this means callerId is initiating connection to me
        peer = createPeer(callerId, false);
        peersRef.current[callerId] = peer;
      }

      peer.signal(signal);
    };

    // Socket Event: User left
    const handleUserLeft = ({ socketId }) => {
      console.log(`[WebRTC] User ${socketId} left.`);
      removePeer(socketId);
    };

    // Register socket listeners
    socket.on('call-user-joined', handleUserJoined);
    socket.on('call-signal', handleSignal);
    socket.on('call-user-left', handleUserLeft);

    return () => {
      isSubscribed = false;
      socket.off('call-user-joined', handleUserJoined);
      socket.off('call-signal', handleSignal);
      socket.off('call-user-left', handleUserLeft);
      leaveCall();
    };
  }, [inCall, socket, roomId, leaveCall]);


  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    }
  };

  return {
    localStream,
    remoteStreams,
    micEnabled,
    cameraEnabled,
    errorMsg,
    toggleMic,
    toggleCamera,
    leaveCall
  };
}
