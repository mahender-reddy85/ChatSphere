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
  return (
    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
          <Avatar user={currentUser} size="md" />
          <span className="ml-3 text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
            {currentUser.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenLogin || onOpenSettings}
            className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
          >
            Login
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-400"
          >
            <IconSettings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsTrigger;
