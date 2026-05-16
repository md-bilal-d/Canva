import { useState, useEffect, useCallback } from 'react';
import * as Y from 'yjs';

export default function useChat(ydoc, currentUser) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!ydoc) return;

    const yMessages = ydoc.getArray('chat_messages');

    const updateMessages = () => {
      setMessages(yMessages.toArray());
    };

    yMessages.observe(updateMessages);
    updateMessages();

    return () => {
      yMessages.unobserve(updateMessages);
    };
  }, [ydoc]);

  const sendMessage = useCallback((text) => {
    if (!ydoc || !text.trim()) return;

    const yMessages = ydoc.getArray('chat_messages');
    const message = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      text,
      sender: currentUser.name,
      senderColor: currentUser.color,
      timestamp: Date.now(),
    };

    ydoc.transact(() => {
      yMessages.push([message]);
    }, 'local');
  }, [ydoc, currentUser]);

  const clearChat = useCallback(() => {
    if (!ydoc) return;
    const yMessages = ydoc.getArray('chat_messages');
    ydoc.transact(() => {
      yMessages.delete(0, yMessages.length);
    }, 'local');
  }, [ydoc]);

  return { messages, sendMessage, clearChat };
}
