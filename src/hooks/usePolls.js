// ============================================================
// usePolls — Collaborative voting/polling via Yjs
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Y from 'yjs';

export default function usePolls(ydoc, currentUserId) {
  const [polls, setPolls] = useState({});
  const yPollsRef = useRef(null);

  useEffect(() => {
    if (!ydoc) return;

    const yPolls = ydoc.getMap('polls');
    yPollsRef.current = yPolls;

    const observe = () => {
      const map = {};
      yPolls.forEach((val, key) => {
        map[key] = val;
      });
      setPolls(map);
    };

    yPolls.observeDeep(observe);
    observe();

    return () => {
      yPolls.unobserveDeep(observe);
    };
  }, [ydoc]);

  const createPoll = useCallback((poll) => {
    const yPolls = yPollsRef.current;
    if (!yPolls) return;

    const id = 'poll-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const options = (poll.options || []).map((text, i) => ({
      id: `opt-${id}-${i}`,
      text,
    }));

    const newPoll = {
      id,
      question: poll.question || 'Untitled Poll',
      options,
      votes: {},        // userId -> optionId (non-anonymous)
      voteCounts: {},    // optionId -> count (anonymous fallback)
      createdBy: currentUserId || 'unknown',
      endsAt: poll.timerMinutes ? Date.now() + poll.timerMinutes * 60 * 1000 : null,
      closed: false,
      anonymous: poll.anonymous || false,
      x: poll.x || 100,
      y: poll.y || 100,
    };

    yPolls.doc.transact(() => {
      yPolls.set(id, newPoll);
    }, 'local');

    return id;
  }, [currentUserId]);

  const vote = useCallback((pollId, optionId) => {
    const yPolls = yPollsRef.current;
    if (!yPolls || !currentUserId) return;

    const poll = yPolls.get(pollId);
    if (!poll || poll.closed) return;

    yPolls.doc.transact(() => {
      const updated = { ...poll };

      if (poll.anonymous) {
        // Anonymous: increment count, track that user voted
        const counts = { ...updated.voteCounts };
        const prevVote = updated.votes?.[currentUserId];
        if (prevVote) {
          counts[prevVote] = Math.max(0, (counts[prevVote] || 0) - 1);
        }
        counts[optionId] = (counts[optionId] || 0) + 1;
        updated.voteCounts = counts;
        updated.votes = { ...updated.votes, [currentUserId]: optionId };
      } else {
        // Non-anonymous: store userId -> optionId
        updated.votes = { ...updated.votes, [currentUserId]: optionId };
      }

      yPolls.set(pollId, updated);
    }, 'local');
  }, [currentUserId]);

  const closePoll = useCallback((pollId) => {
    const yPolls = yPollsRef.current;
    if (!yPolls) return;

    const poll = yPolls.get(pollId);
    if (!poll) return;

    yPolls.doc.transact(() => {
      yPolls.set(pollId, { ...poll, closed: true });
    }, 'local');
  }, []);

  const deletePoll = useCallback((pollId) => {
    const yPolls = yPollsRef.current;
    if (!yPolls) return;

    yPolls.doc.transact(() => {
      yPolls.delete(pollId);
    }, 'local');
  }, []);

  /**
   * Get vote count for an option in a poll.
   */
  const getVoteCount = useCallback((poll, optionId) => {
    if (!poll) return 0;
    if (poll.anonymous) {
      return poll.voteCounts?.[optionId] || 0;
    }
    return Object.values(poll.votes || {}).filter((v) => v === optionId).length;
  }, []);

  const getTotalVotes = useCallback((poll) => {
    if (!poll) return 0;
    if (poll.anonymous) {
      return Object.values(poll.voteCounts || {}).reduce((a, b) => a + b, 0);
    }
    return Object.keys(poll.votes || {}).length;
  }, []);

  return { polls, createPoll, vote, closePoll, deletePoll, getVoteCount, getTotalVotes };
}
