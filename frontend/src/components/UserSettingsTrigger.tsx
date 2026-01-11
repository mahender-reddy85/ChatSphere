import React from 'react';
import type { User } from '../types';
import Avatar from './Avatar';
import { IconSettings } from './Icons';

interface UserSettingsTriggerProps {
  currentUser: User;
  onOpenSettings: () => void;
  onOpenLogin?: () => void;
}

const UserSettingsTrigger: React.FC<UserSettingsTriggerProps> = ({
  currentUser,
  onOpenSettings,
  onOpenLogin,
}) => {
  const isLoggedIn = currentUser && currentUser.id; // Check if user is logged in

  return (
    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
          <Avatar user={currentUser} size="md" />
          <div className="ml-3 min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
              {currentUser.name || 'Guest'}
            </p>
            {isLoggedIn && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                @{currentUser.username || 'user'}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isLoggedIn && onOpenLogin ? (
            <button
              onClick={onOpenLogin}
              className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
            >
              Login
            </button>
          ) : null}
          <button
            onClick={onOpenSettings}
            className="p-2 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-400"
            aria-label="Settings"
          >
            <IconSettings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsTrigger;
