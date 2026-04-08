/**
 * callSignaling.js
 * 
 * Handles WebRTC signaling for the Voice/Video call feature.
 */
module.exports = function (io) {
  // Store socket.id -> roomId
  const userRooms = new Map();

  io.on('connection', (socket) => {

    socket.on('call-join', ({ roomId }) => {
      userRooms.set(socket.id, roomId);
      console.log(`[Call] Client ${socket.id} joined call in room ${roomId}.`);
      
      // Tell everyone else in this room that a new user joined
      socket.to(roomId).emit('call-user-joined', { callerId: socket.id });
    });

    socket.on('call-signal', (payload) => {
      // payload: { to: targetSocketId, signal }
      io.to(payload.to).emit('call-signal', {
        callerId: socket.id,
        signal: payload.signal
      });
    });

    socket.on('call-leave', () => {
      handleLeave(socket);
    });

    socket.on('disconnect', () => {
      handleLeave(socket);
    });
  });

  function handleLeave(socket) {
    const roomId = userRooms.get(socket.id);
    if (roomId) {
      console.log(`[Call] Client ${socket.id} left call in room ${roomId}.`);
      io.to(roomId).emit('call-user-left', { socketId: socket.id });
      userRooms.delete(socket.id);
    }
  }
};
