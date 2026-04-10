// ============================================================
// useNotifications — Real-time notification system
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';

const SERVER_URL = import.meta.env.VITE_WS_URL || 'http://localhost:1234';

export default function useNotifications(socket, userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch existing unread notifications on mount
  useEffect(() => {
    if (!userId) return;

    fetch(`${SERVER_URL}/api/notifications?userId=${encodeURIComponent(userId)}`)
      .then((res) => {
        if (res.ok) return res.json();
        return [];
      })
      .then((data) => {
        const items = Array.isArray(data) ? data : [];
        setNotifications(items);
        setUnreadCount(items.filter((n) => !n.read).length);
      })
      .catch(() => {
        // Server may not have notifications endpoint yet
      });
  }, [userId]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handler = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('notification', handler);
    return () => {
      socket.off('notification', handler);
    };
  }, [socket]);

  const markRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // Persist to server
    fetch(`${SERVER_URL}/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
    }).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    if (userId) {
      fetch(`${SERVER_URL}/api/notifications/read-all?userId=${encodeURIComponent(userId)}`, {
        method: 'PATCH',
      }).catch(() => {});
    }
  }, [userId]);

  return { notifications, unreadCount, markRead, markAllRead };
}
