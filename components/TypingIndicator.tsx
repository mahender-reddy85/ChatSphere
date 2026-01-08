import React from 'react';
import type { User } from '../types';

interface TypingIndicatorProps {
  users: User[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users }) => {
  if (users.length === 0) {
    return <div className="h-6 px-4" />;
  }

  const names = users.map(u => u.name);
  let text: string;

  if (names.length === 1) {
    text = `${names[0]} is typing`;
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing`;
  } else {
    text = 'Several people are typing';
  }

  return (
    <div className="h-6 px-4 text-sm text-gray-500 dark:text-gray-400 italic flex items-center transition-opacity duration-300">
      <p className="truncate">{text}</p>
      <div className="flex items-center space-x-1 ml-1.5">
        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

export default TypingIndicator;
