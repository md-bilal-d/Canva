// ============================================================
// useComments — Figma-style threaded comments via Yjs
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Y from 'yjs';

export default function useComments(ydoc) {
  const [comments, setComments] = useState({});
  const yCommentsRef = useRef(null);

  useEffect(() => {
    if (!ydoc) return;

    const yComments = ydoc.getMap('comments');
    yCommentsRef.current = yComments;

    const observe = () => {
      const map = {};
      yComments.forEach((val, key) => {
        // val is a Y.Array of comment objects
        if (val && typeof val.toArray === 'function') {
          map[key] = val.toArray();
        } else if (Array.isArray(val)) {
          map[key] = val;
        }
      });
      setComments(map);
    };

    yComments.observeDeep(observe);
    observe();

    return () => {
      yComments.unobserveDeep(observe);
    };
  }, [ydoc]);

  const getComments = useCallback((shapeId) => {
    return comments[shapeId] || [];
  }, [comments]);

  const addComment = useCallback((shapeId, comment) => {
    const yComments = yCommentsRef.current;
    if (!yComments) return;

    const id = 'comment-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const newComment = {
      id,
      userId: comment.userId || 'unknown',
      userName: comment.userName || 'Anonymous',
      text: comment.text,
      timestamp: Date.now(),
      resolved: false,
    };

    yComments.doc.transact(() => {
      let yArray = yComments.get(shapeId);
      if (!yArray || typeof yArray.push !== 'function') {
        yArray = new Y.Array();
        yComments.set(shapeId, yArray);
      }
      yArray.push([newComment]);
    }, 'local');

    return id;
  }, []);

  const resolveThread = useCallback((shapeId) => {
    const yComments = yCommentsRef.current;
    if (!yComments) return;

    yComments.doc.transact(() => {
      const yArray = yComments.get(shapeId);
      if (!yArray || typeof yArray.toArray !== 'function') return;

      const items = yArray.toArray();
      yArray.delete(0, yArray.length);
      const resolved = items.map(c => ({ ...c, resolved: true }));
      yArray.push(resolved);
    }, 'local');
  }, []);

  const deleteComment = useCallback((shapeId, commentId) => {
    const yComments = yCommentsRef.current;
    if (!yComments) return;

    yComments.doc.transact(() => {
      const yArray = yComments.get(shapeId);
      if (!yArray || typeof yArray.toArray !== 'function') return;

      const items = yArray.toArray();
      const idx = items.findIndex(c => c.id === commentId);
      if (idx !== -1) {
        yArray.delete(idx, 1);
      }
    }, 'local');
  }, []);

  /**
   * Returns all shape IDs that have unresolved comments.
   */
  const unresolvedShapeIds = Object.entries(comments)
    .filter(([, arr]) => arr.some(c => !c.resolved))
    .map(([shapeId]) => shapeId);

  /**
   * Returns all unresolved threads grouped by shapeId.
   */
  const allUnresolvedThreads = Object.entries(comments)
    .filter(([, arr]) => arr.some(c => !c.resolved))
    .map(([shapeId, arr]) => ({
      shapeId,
      comments: arr.filter(c => !c.resolved),
    }));

  return {
    comments,
    getComments,
    addComment,
    resolveThread,
    deleteComment,
    unresolvedShapeIds,
    allUnresolvedThreads,
  };
}
