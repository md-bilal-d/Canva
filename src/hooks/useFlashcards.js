import { useState, useEffect, useCallback } from 'react';
import * as Y from 'yjs';

export default function useFlashcards(ydoc, shapeId) {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    if (!ydoc) return;
    const yFlashcards = ydoc.getMap('flashcard_widgets');
    
    const updateHandler = () => {
      const data = yFlashcards.get(shapeId);
      if (data && data.cards) {
        setCards(data.cards);
      } else {
        // Initial card if none exist
        if (!data) {
          ydoc.transact(() => {
            yFlashcards.set(shapeId, {
              cards: [{ id: 'card-1', front: 'Front side', back: 'Back side', flipped: false }]
            });
          }, 'local');
        }
      }
    };

    yFlashcards.observeDeep(updateHandler);
    updateHandler();

    return () => yFlashcards.unobserveDeep(updateHandler);
  }, [ydoc, shapeId]);

  const updateCards = useCallback((newCards) => {
    const yFlashcards = ydoc.getMap('flashcard_widgets');
    ydoc.transact(() => {
      yFlashcards.set(shapeId, { cards: newCards });
    }, 'local');
  }, [ydoc, shapeId]);

  const addCard = useCallback(() => {
    const newCard = {
      id: 'card-' + Date.now(),
      front: 'New Question',
      back: 'New Answer',
      flipped: false
    };
    updateCards([...cards, newCard]);
  }, [cards, updateCards]);

  const deleteCard = useCallback((id) => {
    updateCards(cards.filter(c => c.id !== id));
  }, [cards, updateCards]);

  const flipCard = useCallback((id) => {
    updateCards(cards.map(c => c.id === id ? { ...c, flipped: !c.flipped } : c));
  }, [cards, updateCards]);

  const editCard = useCallback((id, side, text) => {
    updateCards(cards.map(c => c.id === id ? { ...c, [side]: text } : c));
  }, [cards, updateCards]);

  return { cards, addCard, deleteCard, flipCard, editCard };
}
