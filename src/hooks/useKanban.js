// ============================================================
// useKanban — Kanban board state via Yjs (same Y.Doc)
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Y from 'yjs';

const DEFAULT_COLUMNS = [
  { id: 'col-todo', title: 'To Do', order: 0 },
  { id: 'col-progress', title: 'In Progress', order: 1 },
  { id: 'col-done', title: 'Done', order: 2 },
];

export default function useKanban(ydoc) {
  const [columns, setColumns] = useState([]);
  const [cards, setCards] = useState({});
  const yKanbanRef = useRef(null);

  useEffect(() => {
    if (!ydoc) return;

    const yKanban = ydoc.getMap('kanban');
    yKanbanRef.current = yKanban;

    // Initialize default columns if empty
    if (!yKanban.has('columns')) {
      ydoc.transact(() => {
        const yColumns = new Y.Array();
        DEFAULT_COLUMNS.forEach((col) => yColumns.push([col]));
        yKanban.set('columns', yColumns);
      }, 'local');
    }

    if (!yKanban.has('cards')) {
      ydoc.transact(() => {
        yKanban.set('cards', new Y.Map());
      }, 'local');
    }

    const observe = () => {
      const yColumns = yKanban.get('columns');
      const yCards = yKanban.get('cards');

      if (yColumns && typeof yColumns.toArray === 'function') {
        setColumns(yColumns.toArray());
      }

      if (yCards && typeof yCards.forEach === 'function') {
        const cardMap = {};
        yCards.forEach((val, key) => {
          cardMap[key] = val;
        });
        setCards(cardMap);
      }
    };

    yKanban.observeDeep(observe);
    observe();

    return () => {
      yKanban.unobserveDeep(observe);
    };
  }, [ydoc]);

  const addCard = useCallback((card) => {
    const yKanban = yKanbanRef.current;
    if (!yKanban) return;

    const id = 'card-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const newCard = {
      id,
      title: card.title || 'New Card',
      description: card.description || '',
      columnId: card.columnId || 'col-todo',
      assignee: card.assignee || null,
      colorLabel: card.colorLabel || '#6366f1',
      dueDate: card.dueDate || null,
      order: card.order || Date.now(),
      createdAt: Date.now(),
    };

    yKanban.doc.transact(() => {
      const yCards = yKanban.get('cards');
      yCards.set(id, newCard);
    }, 'local');

    return id;
  }, []);

  const moveCard = useCallback((cardId, toColumnId, order) => {
    const yKanban = yKanbanRef.current;
    if (!yKanban) return;

    yKanban.doc.transact(() => {
      const yCards = yKanban.get('cards');
      const card = yCards.get(cardId);
      if (card) {
        yCards.set(cardId, {
          ...card,
          columnId: toColumnId,
          order: order || Date.now(),
        });
      }
    }, 'local');
  }, []);

  const updateCard = useCallback((cardId, updates) => {
    const yKanban = yKanbanRef.current;
    if (!yKanban) return;

    yKanban.doc.transact(() => {
      const yCards = yKanban.get('cards');
      const card = yCards.get(cardId);
      if (card) {
        yCards.set(cardId, { ...card, ...updates });
      }
    }, 'local');
  }, []);

  const deleteCard = useCallback((cardId) => {
    const yKanban = yKanbanRef.current;
    if (!yKanban) return;

    yKanban.doc.transact(() => {
      const yCards = yKanban.get('cards');
      yCards.delete(cardId);
    }, 'local');
  }, []);

  const addColumn = useCallback((title) => {
    const yKanban = yKanbanRef.current;
    if (!yKanban) return;

    const id = 'col-' + Date.now();
    yKanban.doc.transact(() => {
      const yColumns = yKanban.get('columns');
      yColumns.push([{ id, title: title || 'New Column', order: yColumns.length }]);
    }, 'local');

    return id;
  }, []);

  const updateColumn = useCallback((columnId, updates) => {
    const yKanban = yKanbanRef.current;
    if (!yKanban) return;

    yKanban.doc.transact(() => {
      const yColumns = yKanban.get('columns');
      const items = yColumns.toArray();
      const idx = items.findIndex((c) => c.id === columnId);
      if (idx !== -1) {
        yColumns.delete(idx, 1);
        yColumns.insert(idx, [{ ...items[idx], ...updates }]);
      }
    }, 'local');
  }, []);

  const deleteColumn = useCallback((columnId) => {
    const yKanban = yKanbanRef.current;
    if (!yKanban) return;

    yKanban.doc.transact(() => {
      const yColumns = yKanban.get('columns');
      const items = yColumns.toArray();
      const idx = items.findIndex((c) => c.id === columnId);
      if (idx !== -1) {
        yColumns.delete(idx, 1);
      }
      // Also delete all cards in this column
      const yCards = yKanban.get('cards');
      const toDelete = [];
      yCards.forEach((card, key) => {
        if (card.columnId === columnId) toDelete.push(key);
      });
      toDelete.forEach((key) => yCards.delete(key));
    }, 'local');
  }, []);

  /**
   * Get cards for a specific column, sorted by order.
   */
  const getColumnCards = useCallback(
    (columnId) =>
      Object.values(cards)
        .filter((c) => c.columnId === columnId)
        .sort((a, b) => (a.order || 0) - (b.order || 0)),
    [cards]
  );

  return {
    columns,
    cards,
    addCard,
    moveCard,
    updateCard,
    deleteCard,
    addColumn,
    updateColumn,
    deleteColumn,
    getColumnCards,
  };
}
