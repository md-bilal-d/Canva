/**
 * boards.js
 *
 * "My Boards" management: CRUD for user boards with thumbnails.
 * SQLite table: boards.
 *
 * Usage in server/index.js:
 *   require('./boards')(app, db);
 */

module.exports = function (app, db) {
  // --- Create table ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT UNIQUE NOT NULL,
      owner_id TEXT NOT NULL,
      name TEXT DEFAULT 'Untitled Board',
      thumbnail_base64 TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Prepared statements
  const listBoards = db.prepare(`
    SELECT * FROM boards WHERE owner_id = ? ORDER BY updated_at DESC
  `);

  const getBoard = db.prepare('SELECT * FROM boards WHERE room_id = ?');

  const insertBoard = db.prepare(`
    INSERT INTO boards (room_id, owner_id, name)
    VALUES (?, ?, ?)
    ON CONFLICT(room_id) DO UPDATE SET
      updated_at = CURRENT_TIMESTAMP
  `);

  const updateBoard = db.prepare(`
    UPDATE boards
    SET name = COALESCE(?, name),
        thumbnail_base64 = COALESCE(?, thumbnail_base64),
        updated_at = CURRENT_TIMESTAMP
    WHERE room_id = ?
  `);

  const deleteBoard = db.prepare('DELETE FROM boards WHERE room_id = ?');

  // --- GET /api/boards?userId=xxx ---
  app.get('/api/boards', (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    try {
      const boards = listBoards.all(userId);
      res.json(boards);
    } catch (err) {
      console.error('[Boards] Error listing:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // --- POST /api/boards ---
  app.post('/api/boards', (req, res) => {
    const { room_id, owner_id, name } = req.body;

    if (!room_id || !owner_id) {
      return res.status(400).json({ error: 'room_id and owner_id required' });
    }

    try {
      insertBoard.run(room_id, owner_id, name || 'Untitled Board');
      const board = getBoard.get(room_id);
      console.log(`[Boards] Created/updated board: ${room_id}`);
      res.json(board);
    } catch (err) {
      console.error('[Boards] Error creating:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // --- PATCH /api/boards/:roomId ---
  app.patch('/api/boards/:roomId', (req, res) => {
    const { roomId } = req.params;
    const { name, thumbnail_base64 } = req.body;

    try {
      updateBoard.run(name || null, thumbnail_base64 || null, roomId);
      const board = getBoard.get(roomId);
      if (!board) return res.status(404).json({ error: 'Board not found' });
      res.json(board);
    } catch (err) {
      console.error('[Boards] Error updating:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // --- DELETE /api/boards/:roomId ---
  app.delete('/api/boards/:roomId', (req, res) => {
    const { roomId } = req.params;

    try {
      deleteBoard.run(roomId);
      console.log(`[Boards] Deleted board: ${roomId}`);
      res.json({ success: true });
    } catch (err) {
      console.error('[Boards] Error deleting:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};
