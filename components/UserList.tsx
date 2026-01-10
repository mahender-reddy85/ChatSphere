import React, { useCallback } from 'react';
import type { User } from '../types';
import Avatar from './Avatar';
import { IconShare } from './Icons';
import { useChat } from '../hooks/useChat';
import type { User as CurrentUser } from '../types';
import { toast } from '../hooks/useToast';

interface UserListProps {
  users: User[];
  title: string;
  roomId: string;
  currentUser: User;
}

const UserList: React.FC<UserListProps> = ({ users, title, roomId, currentUser }) => {
  const { isUserOnline } = useChat(currentUser);
  const handleInvite = useCallback(() => {
    navigator.clipboard.writeText(roomId);
    toast.success(`Invite code "${roomId}" copied to clipboard!`);
  }, [roomId]);

  return (
    <div className="flex-grow flex flex-col min-h-0">
      <div className="flex justify-between items-center px-4 pt-4 mb-2">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h2>
        <button onClick={handleInvite} className="flex items-center gap-1.5 px-2 py-1 text-xs text-primary-600 dark:text-primary-400 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/50">
          <IconShare className="w-3 h-3" /> Invite
        </button>
      </div>
      <nav className="space-y-1 overflow-y-auto flex-grow p-2">
        {users.map((user) => (
          <div key={user.id} className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300">
            <div className="relative">
              <Avatar user={user} size="sm" />
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                isUserOnline(user.id) ? 'bg-green-500' : 'bg-gray-400'
              }`}></span>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="truncate">{user.name} {user.id === currentUser.id ? '(You)' : ''}</span>
                <span className="text-xs text-gray-500 ml-2">
                  {isUserOnline(user.id) ? 'online' : 'offline'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default UserList;