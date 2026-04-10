// ============================================================
// useMentions — @mention detection + notification via Yjs
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Plays a short notification "ding" using the Web Audio API.
 */
function playMentionSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);

    setTimeout(() => ctx.close(), 500);
  } catch (e) {
    // Silently ignore — user hasn't interacted yet or Web Audio unsupported
  }
}

/**
 * Extracts @Username mentions from a message string.
 * Returns an array of mentioned usernames.
 */
export function extractMentions(text) {
  const regex = /@(\S+)/g;
  const mentions = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return mentions;
}

export default function useMentions(ydoc, currentUserName) {
  const [mentionCount, setMentionCount] = useState(0);
  const processedRef = useRef(new Set());
  const yChatRef = useRef(null);

  useEffect(() => {
    if (!ydoc) return;

    const yChat = ydoc.getArray('chat');
    yChatRef.current = yChat;

    const observe = (event) => {
      // Only process newly added items
      let index = 0;
      event.changes.delta.forEach((delta) => {
        if (delta.retain) {
          index += delta.retain;
        }
        if (delta.insert) {
          delta.insert.forEach((msg) => {
            if (msg && msg.id && !processedRef.current.has(msg.id)) {
              processedRef.current.add(msg.id);
              // Check if this message mentions the current user
              if (msg.text && currentUserName) {
                const mentions = extractMentions(msg.text);
                const isMentioned = mentions.some(
                  (m) => m.toLowerCase() === currentUserName.toLowerCase()
                );
                if (isMentioned && msg.userName !== currentUserName) {
                  setMentionCount((prev) => prev + 1);
                  playMentionSound();
                }
              }
            }
          });
        }
      });
    };

    yChat.observe(observe);

    return () => {
      yChat.unobserve(observe);
    };
  }, [ydoc, currentUserName]);

  const clearMentions = useCallback(() => {
    setMentionCount(0);
  }, []);

  return { mentionCount, clearMentions };
}
