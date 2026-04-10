// ============================================================
// useAnalytics — Board analytics data fetching
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';

const SERVER_URL = import.meta.env.VITE_WS_URL || 'http://localhost:1234';
const POLL_INTERVAL = 30000; // 30 seconds

export default function useAnalytics(roomId) {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchStats = useCallback(async () => {
    if (!roomId) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/analytics/${roomId}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Server may not have analytics endpoint yet
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  const fetchEvents = useCallback(async (page = 1, limit = 50) => {
    if (!roomId) return;
    try {
      const res = await fetch(
        `${SERVER_URL}/api/analytics/${roomId}/events?page=${page}&limit=${limit}`
      );
      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : data.events || []);
      }
    } catch {
      // Silently ignore
    }
  }, [roomId]);

  // Initial fetch + polling
  useEffect(() => {
    fetchStats();
    fetchEvents();

    intervalRef.current = setInterval(() => {
      fetchStats();
    }, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStats, fetchEvents]);

  return { stats, events, loading, refreshStats: fetchStats, refreshEvents: fetchEvents };
}
