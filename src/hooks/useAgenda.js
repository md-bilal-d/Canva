// ============================================================
// useAgenda — Meeting agenda + notes via Yjs
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Y from 'yjs';

export default function useAgenda(ydoc) {
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [currentItemId, setCurrentItemId] = useState(null);
  const yAgendaRef = useRef(null);
  const yNotesRef = useRef(null);

  useEffect(() => {
    if (!ydoc) return;

    const yAgenda = ydoc.getArray('agenda');
    yAgendaRef.current = yAgenda;

    let yMeetingNotes = ydoc.getText('meetingNotes');
    yNotesRef.current = yMeetingNotes;

    const observeAgenda = () => {
      setItems(yAgenda.toArray());
      const current = yAgenda.toArray().find((item) => item.status === 'current');
      setCurrentItemId(current?.id || null);
    };

    const observeNotes = () => {
      setNotes(yMeetingNotes.toString());
    };

    yAgenda.observeDeep(observeAgenda);
    yMeetingNotes.observe(observeNotes);
    observeAgenda();
    observeNotes();

    return () => {
      yAgenda.unobserveDeep(observeAgenda);
      yMeetingNotes.unobserve(observeNotes);
    };
  }, [ydoc]);

  const addItem = useCallback((item) => {
    const yAgenda = yAgendaRef.current;
    if (!yAgenda) return;

    const id = 'agenda-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    yAgenda.doc.transact(() => {
      yAgenda.push([{
        id,
        title: item.title || 'Untitled',
        duration: item.duration || 5,         // minutes
        ownerId: item.ownerId || null,
        ownerName: item.ownerName || '',
        status: 'pending',                     // pending | current | done
        startedAt: null,
      }]);
    }, 'local');

    return id;
  }, []);

  const removeItem = useCallback((itemId) => {
    const yAgenda = yAgendaRef.current;
    if (!yAgenda) return;

    yAgenda.doc.transact(() => {
      const arr = yAgenda.toArray();
      const idx = arr.findIndex((i) => i.id === itemId);
      if (idx !== -1) yAgenda.delete(idx, 1);
    }, 'local');
  }, []);

  const reorderItem = useCallback((fromIndex, toIndex) => {
    const yAgenda = yAgendaRef.current;
    if (!yAgenda) return;

    yAgenda.doc.transact(() => {
      const arr = yAgenda.toArray();
      if (fromIndex < 0 || fromIndex >= arr.length || toIndex < 0 || toIndex >= arr.length) return;
      const item = arr[fromIndex];
      yAgenda.delete(fromIndex, 1);
      yAgenda.insert(toIndex, [item]);
    }, 'local');
  }, []);

  const setCurrentItem = useCallback((itemId) => {
    const yAgenda = yAgendaRef.current;
    if (!yAgenda) return;

    yAgenda.doc.transact(() => {
      const arr = yAgenda.toArray();
      // Clear all current, set selected
      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        let newStatus = item.status;
        let startedAt = item.startedAt;

        if (item.id === itemId) {
          newStatus = 'current';
          startedAt = Date.now();
        } else if (item.status === 'current') {
          newStatus = 'done';
          startedAt = item.startedAt;
        }

        if (newStatus !== item.status || startedAt !== item.startedAt) {
          yAgenda.delete(i, 1);
          yAgenda.insert(i, [{ ...item, status: newStatus, startedAt }]);
        }
      }
    }, 'local');
  }, []);

  const updateStatus = useCallback((itemId, status) => {
    const yAgenda = yAgendaRef.current;
    if (!yAgenda) return;

    yAgenda.doc.transact(() => {
      const arr = yAgenda.toArray();
      const idx = arr.findIndex((i) => i.id === itemId);
      if (idx !== -1) {
        yAgenda.delete(idx, 1);
        yAgenda.insert(idx, [{ ...arr[idx], status }]);
      }
    }, 'local');
  }, []);

  const updateNotes = useCallback((newText) => {
    const yNotes = yNotesRef.current;
    if (!yNotes) return;

    yNotes.doc.transact(() => {
      yNotes.delete(0, yNotes.length);
      yNotes.insert(0, newText);
    }, 'local');
  }, []);

  const exportNotes = useCallback(() => {
    const blob = new Blob([notes], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `meeting-notes-${Date.now()}.txt`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [notes]);

  return {
    items,
    notes,
    currentItemId,
    addItem,
    removeItem,
    reorderItem,
    setCurrentItem,
    updateStatus,
    updateNotes,
    exportNotes,
  };
}
