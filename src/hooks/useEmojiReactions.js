import { useEffect, useState, useCallback, useRef } from 'react';

export default function useEmojiReactions(yDoc, provider, currentUser) {
  const [reactions, setReactions] = useState([]);
  const emojiArrayRef = useRef(null);

  useEffect(() => {
    if (!yDoc) return;
    
    emojiArrayRef.current = yDoc.getArray('emojiReactions');
    
    const observer = () => {
      setReactions(emojiArrayRef.current.toArray());
    };

    emojiArrayRef.current.observe(observer);
    // Initial fetch
    setReactions(emojiArrayRef.current.toArray());

    return () => {
      emojiArrayRef.current.unobserve(observer);
    };
  }, [yDoc]);

  // Hook into awareness for instantaneous reactions
  const [awarenessReactions, setAwarenessReactions] = useState([]);
  
  useEffect(() => {
    if (!provider || !provider.awareness) return;
    const awareness = provider.awareness;

    const handleAwarenessUpdate = () => {
      const states = awareness.getStates();
      const currentAwarenessReactions = [];
      states.forEach(state => {
        if (state.emojiReaction) {
          currentAwarenessReactions.push(state.emojiReaction);
        }
      });
      setAwarenessReactions(currentAwarenessReactions);
    };

    awareness.on('change', handleAwarenessUpdate);
    return () => {
      awareness.off('change', handleAwarenessUpdate);
    };
  }, [provider]);

  const addReaction = useCallback((emoji, x, y) => {
    const reaction = {
      id: Date.now() + '-' + Math.random().toString(36).substring(2, 9),
      emoji,
      x,
      y,
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || 'Guest',
      timestamp: Date.now()
    };

    // 1. Broadcast via Awareness for instant local feedback before Yjs array syncs
    if (provider && provider.awareness) {
      provider.awareness.setLocalStateField('emojiReaction', reaction);
      
      // Clear awareness quickly since it shouldn't persist there long
      setTimeout(() => {
        if (provider.awareness.getLocalState()?.emojiReaction?.id === reaction.id) {
          provider.awareness.setLocalStateField('emojiReaction', null);
        }
      }, 100); 
    }

    // 2. Sync by pushing to Y.Array
    if (emojiArrayRef.current) {
      emojiArrayRef.current.push([reaction]);

      // Auto-delete entries from Y.Array after 3 seconds
      setTimeout(() => {
        if (!emojiArrayRef.current) return;
        const arr = emojiArrayRef.current.toArray();
        const index = arr.findIndex(r => r.id === reaction.id);
        if (index !== -1) {
          emojiArrayRef.current.delete(index, 1);
        }
      }, 3000);
    }
  }, [currentUser, provider]);

  // Deduplicate and combine reactions (using Map to prefer awareness but dedupe by ID)
  const allReactions = [...reactions, ...awarenessReactions];
  const uniqueReactions = Array.from(new Map(allReactions.map(r => [r.id, r])).values());
  
  // Filter out any stale reactions just in case timeouts missed or clients desync
  const activeReactions = uniqueReactions.filter(r => Date.now() - r.timestamp < 3500);

  return { reactions: activeReactions, addReaction };
}
