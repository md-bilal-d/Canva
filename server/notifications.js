/**
 * notifications.js
 *
 * Real-time notification system.
 * Triggers: join, comment, mention, invite accepted.
 * Stores notifications in SQLite and pushes via Socket.IO.
 *
 * Usage in server/index.js:
 *   require('./notifications')(io, app, db);
 */

module.exports = function (io, app, db) {
  // --- Create notifications table ---
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      boardId TEXT,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const insertNotif = db.prepare(`
    INSERT INTO notifications (userId, type, message, boardId)
    VALUES (?, ?, ?, ?)
  `);

  const getUnread = db.prepare(`
    SELECT * FROM notifications
    WHERE userId = ? AND read = 0
    ORDER BY created_at DESC
    LIMIT 50
  `);

  const markReadStmt = db.prepare(`
    UPDATE notifications SET read = 1 WHERE id = ?
  `);

  const markAllReadStmt = db.prepare(`
    UPDATE notifications SET read = 1 WHERE userId = ?
  `);

  // --- Track userId -> socketId mapping ---
  const userSockets = new Map(); // userId -> Set<socketId>

  /**
   * Send a notification to a specific user.
   * Saves to DB and pushes via socket if user is online.
   */
  function sendNotification(userId, type, message, boardId) {
    try {
      const result = insertNotif.run(userId, type, message, boardId || null);
      const notif = {
        id: result.lastInsertRowid,
        userId,
        type,
        message,
        boardId: boardId || null,
        read: false,
        created_at: Date.now(),
        timestamp: Date.now(),
      };

      // Push to user's socket(s) if online
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.forEach((socketId) => {
          io.to(socketId).emit('notification', notif);
        });
      }
    } catch (err) {
      console.error('[Notifications] Error sending notification:', err.message);
    }
  }

  // --- Socket event: register user mapping ---
  io.on('connection', (socket) => {
    socket.on('register-user', (userId) => {
      if (!userId) return;
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);
      console.log(`[Notifications] User ${userId} registered socket ${socket.id}`);
    });

    socket.on('disconnect', () => {
      // Clean up user mapping
      for (const [userId, sockets] of userSockets.entries()) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }
    });

    // Trigger: someone joins a board
    socket.on('join-room-notify', ({ roomId, userId, userName, ownerId }) => {
      if (ownerId && ownerId !== userId) {
        sendNotification(ownerId, 'join', `${userName || 'Someone'} joined your board`, roomId);
      }
    });

    // Trigger: someone comments on a shape
    socket.on('comment-notify', ({ roomId, shapeCreatorId, commenterName }) => {
      if (shapeCreatorId) {
        sendNotification(
          shapeCreatorId,
          'comment',
          `${commenterName || 'Someone'} commented on your shape`,
          roomId
        );
      }
    });

    // Trigger: someone @mentions you
    socket.on('mention-notify', ({ roomId, mentionedUserId, mentionerName }) => {
      if (mentionedUserId) {
        sendNotification(
          mentionedUserId,
          'mention',
          `${mentionerName || 'Someone'} mentioned you in chat`,
          roomId
        );
      }
    });

    // Trigger: invite accepted
    socket.on('invite-accepted-notify', ({ roomId, inviterId, accepterName }) => {
      if (inviterId) {
        sendNotification(
          inviterId,
          'invite',
          `${accepterName || 'Someone'} accepted your board invite`,
          roomId
        );
      }
    });
  });

  // --- REST API Endpoints ---

  // GET /api/notifications?userId=xxx
  app.get('/api/notifications', (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    try {
      const notifications = getUnread.all(userId);
      res.json(notifications);
    } catch (err) {
      console.error('[Notifications] Error fetching:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PATCH /api/notifications/:id/read
  app.patch('/api/notifications/:id/read', (req, res) => {
    const { id } = req.params;
    try {
      markReadStmt.run(id);
      res.json({ success: true });
    } catch (err) {
      console.error('[Notifications] Error marking read:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PATCH /api/notifications/read-all?userId=xxx
  app.patch('/api/notifications/read-all', (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    try {
      markAllReadStmt.run(userId);
      res.json({ success: true });
    } catch (err) {
      console.error('[Notifications] Error marking all read:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Export the sendNotification function for other modules to use
  return { sendNotification };
};
