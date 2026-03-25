import React from 'react';
import type { User } from '../types';
import { IconUser, IconAI } from './Icons';

interface AvatarProps {
  user: User;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const statusClasses = {
  xs: 'w-1.5 h-1.5 bottom-0 right-0',
  sm: 'w-2 h-2 bottom-0 right-0',
  md: 'w-2.5 h-2.5 bottom-0.5 right-0.5',
  lg: 'w-3 h-3 bottom-1 right-1',
};

const Avatar: React.FC<AvatarProps> = ({ user, size = 'sm' }) => {
  const iconSize = {
    xs: 'p-0.5',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  const Icon = user.id === 'ai-bot' ? IconAI : IconUser;

  return (
    <div className="relative flex-shrink-0">
      <div
        className={`${sizeClasses[size]} rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden`}
      >
        {user.profilePicture ? (
          <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <Icon className={`text-gray-500 dark:text-gray-400 ${iconSize[size]}`} />
        )}
      </div>
      <span
        className={`absolute block ${statusClasses[size]} ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'} border-2 border-white rounded-full dark:border-gray-800`}
      />
    </div>
  );
};

export default Avatar;
