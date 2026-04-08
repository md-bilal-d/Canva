import React, { useState } from 'react';

const EMOJIS = ['👍', '❤️', '🔥', '✅', '❌', '💡', '🎉', '😂', '😮', '👀', '🤔', '⭐'];

export default function EmojiPicker({ activeEmoji, onSelectEmoji }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative flex items-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-10 w-10 items-center justify-center rounded-md border text-xl transition-colors ${
          activeEmoji 
            ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
            : 'border-transparent hover:bg-gray-100'
        }`}
        title="Emoji Drop Mode"
      >
        {activeEmoji || '😊'}
      </button>

      {isOpen && (
        <div className="absolute top-12 left-0 z-50 w-[180px] rounded-lg border bg-white p-2 shadow-xl">
          <div className="mb-2 grid grid-cols-4 gap-1">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onSelectEmoji(emoji);
                  setIsOpen(false);
                }}
                className="flex aspect-square items-center justify-center rounded text-xl hover:bg-gray-100"
              >
                {emoji}
              </button>
            ))}
          </div>
          {activeEmoji && (
            <button
              onClick={() => {
                onSelectEmoji(null);
                setIsOpen(false);
              }}
              className="w-full rounded p-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
