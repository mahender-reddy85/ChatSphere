import React from 'react';
import type { Message } from '../types';
import { IconPin, IconX } from './Icons';

interface PinnedMessagesBarProps {
  messages: Message[];
  onUnpin: (messageId: string) => void;
}

const PinnedMessagesBar: React.FC<PinnedMessagesBarProps> = ({ messages, onUnpin }) => {
  if (messages.length === 0) {
    return null;
  }

  // For simplicity, we'll just show the first pinned message.
  // A more complex implementation could cycle through them or have a dedicated view.
  const message = messages[0];

  return (
    <div className="p-2 bg-primary-50 dark:bg-primary-900/40 border-b border-primary-200 dark:border-primary-800 flex-shrink-0">
      <div className="flex items-center justify-between text-sm max-w-full mx-auto px-2">
        <div className="flex items-center min-w-0">
          <IconPin className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
          <div className="ml-2 min-w-0">
            <span className="font-semibold text-primary-800 dark:text-primary-200">
              {message.author.name}
            </span>
            <span className="text-gray-600 dark:text-gray-300 ml-1 truncate">: {message.text}</span>
          </div>
        </div>
        <button
          onClick={() => onUnpin(message.id)}
          className="p-1 rounded-full hover:bg-primary-100 dark:hover:bg-primary-800/60 flex-shrink-0 ml-2"
        >
          <IconX className="w-4 h-4 text-primary-600 dark:text-primary-400" />
        </button>
      </div>
    </div>
  );
};

export default PinnedMessagesBar;
