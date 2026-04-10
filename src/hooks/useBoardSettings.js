// ============================================================
// useBoardSettings — Board sharing & privacy controls
// ============================================================

import { useState, useEffect, useCallback } from 'react';

const SERVER_URL = import.meta.env.VITE_WS_URL || 'http://localhost:1234';

export default function useBoardSettings(roomId) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/board/${roomId}/settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      } else {
        // Default settings if none exist
        setSettings({
          roomId,
          visibility: 'link',
          ownerId: null,
          members: [],
        });
      }
    } catch {
      setSettings({
        roomId,
        visibility: 'link',
        ownerId: null,
        members: [],
      });
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateVisibility = useCallback(async (visibility) => {
    if (!roomId) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/board/${roomId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility }),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('[BoardSettings] Failed to update visibility:', err);
    }
  }, [roomId]);

  const inviteMember = useCallback(async (email, role = 'editor') => {
    if (!roomId) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/board/${roomId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      if (res.ok) {
        await fetchSettings();
      }
    } catch (err) {
      console.error('[BoardSettings] Failed to invite member:', err);
    }
  }, [roomId, fetchSettings]);

  const removeMember = useCallback(async (userId) => {
    if (!roomId) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/board/${roomId}/member/${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchSettings();
      }
    } catch (err) {
      console.error('[BoardSettings] Failed to remove member:', err);
    }
  }, [roomId, fetchSettings]);

  return { settings, updateVisibility, inviteMember, removeMember, loading };
}
