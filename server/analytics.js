/**
 * analytics.js
 *
 * Board analytics: event tracking + summary stats.
 * SQLite table: board_events.
 *
 * Usage in server/index.js:
 *   require('./analytics')(app, io, db);
 */

module.exports = function (app, io, db) {
  // --- Create table ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS board_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      user_id TEXT,
      user_name TEXT,
      event_type TEXT NOT NULL,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_board_events_room
    ON board_events (room_id, created_at DESC)
  `);

  // Prepared statements
  const insertEvent = db.prepare(`
    INSERT INTO board_events (room_id, user_id, user_name, event_type, metadata)
    VALUES (?, ?, ?, ?, ?)
  `);

  const totalVisits = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count
    FROM board_events WHERE room_id = ? AND event_type = 'user-joined'
  `);

  const totalShapes = db.prepare(`
    SELECT COUNT(*) as count
    FROM board_events WHERE room_id = ? AND event_type = 'shape-added'
  `);

  const chatMessages = db.prepare(`
    SELECT COUNT(*) as count
    FROM board_events WHERE room_id = ? AND event_type = 'chat-message'
  `);

  const topContributor = db.prepare(`
    SELECT user_name, COUNT(*) as count
    FROM board_events
    WHERE room_id = ? AND event_type = 'shape-added' AND user_name IS NOT NULL
    GROUP BY user_name
    ORDER BY count DESC
    LIMIT 1
  `);

  const dailyActivity = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM board_events
    WHERE room_id = ? AND created_at >= datetime('now', '-7 days')
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);

  const getEvents = db.prepare(`
    SELECT * FROM board_events
    WHERE room_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);

  // --- Track active users per room ---
  const activeUsers = new Map(); // roomId -> Set<socketId>

  // --- Socket event tracking ---
  io.on('connection', (socket) => {
    socket.on('analytics-track', ({ roomId, userId, userName, eventType, metadata }) => {
      if (!roomId || !eventType) return;

      try {
        insertEvent.run(
          roomId,
          userId || null,
          userName || null,
          eventType,
          metadata ? JSON.stringify(metadata) : null
        );
      } catch (err) {
        console.error('[Analytics] Error tracking event:', err.message);
      }
    });

    // Track active users
    socket.on('analytics-join', ({ roomId }) => {
      if (!roomId) return;
      if (!activeUsers.has(roomId)) {
        activeUsers.set(roomId, new Set());
      }
      activeUsers.get(roomId).add(socket.id);
    });

    socket.on('disconnect', () => {
      for (const [roomId, sockets] of activeUsers.entries()) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          activeUsers.delete(roomId);
        }
      }
    });
  });

  // --- GET /api/analytics/:roomId ---
  app.get('/api/analytics/:roomId', (req, res) => {
    const { roomId } = req.params;

    try {
      const visits = totalVisits.get(roomId);
      const shapes = totalShapes.get(roomId);
      const messages = chatMessages.get(roomId);
      const top = topContributor.get(roomId);
      const daily = dailyActivity.all(roomId);
      const active = activeUsers.get(roomId);

      // Fill in missing days for the chart
      const filledDaily = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const found = daily.find((d) => d.date === dateStr);
        filledDaily.push({
          date: dateStr,
          count: found ? found.count : 0,
        });
      }

      res.json({
        totalVisits: visits?.count || 0,
        activeUsers: active ? active.size : 0,
        totalShapes: shapes?.count || 0,
        chatMessages: messages?.count || 0,
        topContributor: top || null,
        dailyActivity: filledDaily,
      });
    } catch (err) {
      console.error('[Analytics] Error fetching stats:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // --- GET /api/analytics/:roomId/events?page=1&limit=50 ---
  app.get('/api/analytics/:roomId/events', (req, res) => {
    const { roomId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    try {
      const events = getEvents.all(roomId, limit, offset);
      res.json({ events, page, limit });
    } catch (err) {
      console.error('[Analytics] Error fetching events:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};
