/**
 * sharing.js
 *
 * Board sharing and privacy controls.
 * SQLite tables: board_settings, board_invites.
 *
 * Usage in server/index.js:
 *   require('./sharing')(app, db);
 */

module.exports = function (app, db) {
  // --- Create tables ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS board_settings (
      room_id TEXT PRIMARY KEY,
      visibility TEXT DEFAULT 'link',
      owner_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS board_invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT DEFAULT 'editor',
      accepted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Prepared statements
  const getSettings = db.prepare('SELECT * FROM board_settings WHERE room_id = ?');
  const upsertSettings = db.prepare(`
    INSERT INTO board_settings (room_id, visibility, owner_id)
    VALUES (?, ?, ?)
    ON CONFLICT(room_id) DO UPDATE SET
      visibility = excluded.visibility
  `);
  const getInvites = db.prepare('SELECT * FROM board_invites WHERE room_id = ?');
  const insertInvite = db.prepare(`
    INSERT INTO board_invites (room_id, email, role) VALUES (?, ?, ?)
  `);
  const deleteInvite = db.prepare('DELETE FROM board_invites WHERE room_id = ? AND email = ?');

  // --- GET /api/board/:roomId/settings ---
  app.get('/api/board/:roomId/settings', (req, res) => {
    const { roomId } = req.params;
    try {
      const settings = getSettings.get(roomId);
      const invites = getInvites.all(roomId);

      if (!settings) {
        return res.json({
          roomId,
          visibility: 'link',
          ownerId: null,
          members: invites.map((inv) => ({
            id: inv.email,
            email: inv.email,
            role: inv.role,
            accepted: !!inv.accepted,
          })),
        });
      }

      res.json({
        roomId: settings.room_id,
        visibility: settings.visibility,
        ownerId: settings.owner_id,
        members: invites.map((inv) => ({
          id: inv.email,
          email: inv.email,
          role: inv.role,
          accepted: !!inv.accepted,
        })),
      });
    } catch (err) {
      console.error('[Sharing] Error getting settings:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // --- POST /api/board/:roomId/settings ---
  app.post('/api/board/:roomId/settings', (req, res) => {
    const { roomId } = req.params;
    const { visibility, ownerId } = req.body;

    try {
      upsertSettings.run(roomId, visibility || 'link', ownerId || null);
      const settings = getSettings.get(roomId);
      const invites = getInvites.all(roomId);

      res.json({
        roomId: settings.room_id,
        visibility: settings.visibility,
        ownerId: settings.owner_id,
        members: invites.map((inv) => ({
          id: inv.email,
          email: inv.email,
          role: inv.role,
          accepted: !!inv.accepted,
        })),
      });
    } catch (err) {
      console.error('[Sharing] Error updating settings:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // --- POST /api/board/:roomId/invite ---
  app.post('/api/board/:roomId/invite', (req, res) => {
    const { roomId } = req.params;
    const { email, role } = req.body;

    if (!email) return res.status(400).json({ error: 'email required' });

    try {
      insertInvite.run(roomId, email, role || 'editor');
      console.log(`[Sharing] Invited ${email} to room ${roomId} as ${role || 'editor'}`);
      res.json({ success: true });
    } catch (err) {
      console.error('[Sharing] Error inviting:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // --- DELETE /api/board/:roomId/member/:userId ---
  app.delete('/api/board/:roomId/member/:userId', (req, res) => {
    const { roomId, userId } = req.params;

    try {
      deleteInvite.run(roomId, userId);
      res.json({ success: true });
    } catch (err) {
      console.error('[Sharing] Error removing member:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};
