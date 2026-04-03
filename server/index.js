// ============================================================
// Collaborative Whiteboard Server
// Express + Socket.IO + y-socket.io + SQLite Persistence
// ============================================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Y = require('yjs');
const Database = require('better-sqlite3');
const path = require('path');

// --- Express & HTTP Setup ---
const app = express();
const server = http.createServer(app);

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    rooms: Object.keys(docs).length,
    uptime: process.uptime(),
  });
});

// --- Socket.IO Setup ---
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// --- SQLite Persistence ---
const DB_PATH = path.join(__dirname, 'whiteboard.db');
console.log(`[DB] SQLite database stored at: ${DB_PATH}`);

const db = new Database(DB_PATH);

// Create rooms table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    room_name TEXT PRIMARY KEY,
    ydoc_state BLOB,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Prepared statements for performance
const loadRoomStmt = db.prepare('SELECT ydoc_state FROM rooms WHERE room_name = ?');
const saveRoomStmt = db.prepare(`
  INSERT INTO rooms (room_name, ydoc_state, updated_at) 
  VALUES (?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(room_name) DO UPDATE SET 
    ydoc_state = excluded.ydoc_state,
    updated_at = CURRENT_TIMESTAMP
`);

// --- In-Memory Y.Doc Store ---
// Each room gets its own Y.Doc instance
const docs = {};
const saveTimers = {};

/**
 * Get or create a Y.Doc for a given room.
 * If the room exists in the database, load the persisted state.
 */
function getOrCreateDoc(roomName) {
  if (docs[roomName]) return docs[roomName];

  const doc = new Y.Doc();

  // Try to load persisted state from SQLite
  const row = loadRoomStmt.get(roomName);
  if (row && row.ydoc_state) {
    try {
      Y.applyUpdate(doc, new Uint8Array(row.ydoc_state));
      console.log(`[Room] Loaded persisted state for room: ${roomName}`);
    } catch (err) {
      console.error(`[Room] Error loading state for room ${roomName}:`, err.message);
    }
  } else {
    console.log(`[Room] Created new room: ${roomName}`);
  }

  // Listen for updates and debounce-save to database
  doc.on('update', () => {
    debounceSave(roomName, doc);
  });

  docs[roomName] = doc;
  return doc;
}

/**
 * Debounce save: waits 500ms after the last update before persisting.
 */
function debounceSave(roomName, doc) {
  if (saveTimers[roomName]) {
    clearTimeout(saveTimers[roomName]);
  }
  saveTimers[roomName] = setTimeout(() => {
    try {
      const state = Y.encodeStateAsUpdate(doc);
      saveRoomStmt.run(roomName, Buffer.from(state));
      console.log(`[DB] Saved room: ${roomName} (${state.byteLength} bytes)`);
    } catch (err) {
      console.error(`[DB] Error saving room ${roomName}:`, err.message);
    }
  }, 500);
}

// --- Socket.IO Connection Handling ---
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  let currentRoom = null;
  let currentDoc = null;

  // Client joins a room
  socket.on('join-room', (roomName) => {
    if (currentRoom) {
      socket.leave(currentRoom);
    }

    currentRoom = roomName;
    socket.join(roomName);

    // Get or create the Y.Doc for this room
    currentDoc = getOrCreateDoc(roomName);

    // Send the full document state to the newly connected client
    const stateVector = Y.encodeStateAsUpdate(currentDoc);
    socket.emit('yjs-sync', Buffer.from(stateVector).toString('base64'));

    console.log(`[Room] Client ${socket.id} joined room: ${roomName}`);
  });

  // Client sends a Yjs update
  socket.on('yjs-update', (updateBase64) => {
    if (!currentDoc || !currentRoom) return;

    try {
      const update = new Uint8Array(Buffer.from(updateBase64, 'base64'));
      Y.applyUpdate(currentDoc, update);

      // Broadcast to all OTHER clients in the room
      socket.to(currentRoom).emit('yjs-update', updateBase64);
    } catch (err) {
      console.error(`[Yjs] Error applying update:`, err.message);
    }
  });

  // Awareness updates (cursors, etc.)
  socket.on('awareness-update', (data) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('awareness-update', {
      ...data,
      clientId: socket.id,
    });
  });

  // Client disconnects
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
    if (currentRoom) {
      // Notify others that this user's awareness should be removed
      socket.to(currentRoom).emit('awareness-remove', socket.id);
    }
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 1234;
server.listen(PORT, () => {
  console.log(`\n🚀 Whiteboard server running on http://localhost:${PORT}`);
  console.log(`📁 Database: ${DB_PATH}\n`);
});
