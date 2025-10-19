import React, { useState } from 'react';
import type { Room, User } from '../types';
import { IconAI, IconUsers, IconPlusCircle, IconLogin, IconUser, IconLock, IconGlobe, IconTrash } from './Icons';
import JoinRoomModal from './JoinRoomModal';
import CreateRoomModal from './CreateRoomModal';
import SearchBar from './SearchBar';
import Avatar from './Avatar';

interface RoomListProps {
  rooms: Room[];
  activeRoom: Room | null;
  setActiveRoom: (room: Room) => void;
  createRoom: (name: string, privacy: 'public' | 'private') => string;
  joinRoom: (roomId: string, password?: string) => 'joined' | 'needs_password' | 'invalid_password' | 'not_found' | 'already_joined';
  deleteRoom: (roomId: string) => void;
  unreadCounts: Record<string, number>;
  onSearch: (query: string, scope: 'current' | 'all') => void;
  currentUser: User;
}

const RoomIcon = ({ room }: { room: Room }) => {
    if (room.type === 'ai') {
        return <IconAI className="w-8 h-8 p-1.5 bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400 rounded-full" />;
    }
    if (room.type === 'self') {
        return <IconUser className="w-8 h-8 p-1.5 bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400 rounded-full" />;
    }
    return <IconUsers className="w-8 h-8 p-1.5 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400 rounded-full" />;
};

const RoomList: React.FC<RoomListProps> = ({ rooms, activeRoom, setActiveRoom, createRoom, joinRoom, deleteRoom, unreadCounts, onSearch, currentUser }) => {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
  return (
    <div className="flex-grow flex flex-col min-h-0">
      <h2 className="px-2 mb-2 text-lg font-semibold text-gray-800 dark:text-gray-200 md:block hidden">Chats</h2>
      <SearchBar onSearch={onSearch} disabled={!activeRoom} />
      <div className="flex items-center gap-2 mb-2 px-2 flex-col md:flex-row">
        <button onClick={() => setIsCreateModalOpen(true)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
            <IconPlusCircle className="w-5 h-5" /> New
        </button>
        <button onClick={() => setIsJoinModalOpen(true)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
            <IconLogin className="w-5 h-5" /> Join
        </button>
      </div>
      <nav className="space-y-1 overflow-y-auto flex-grow pr-2 pl-2">
        {rooms.map((room) => {
          const unreadCount = unreadCounts[room.id] || 0;
          const isGroup = room.type === 'group';
          const isDeletable = room.type === 'group';
          return (
          <div key={room.id} className="relative group">
            <button
              onClick={() => setActiveRoom(room)}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 text-left ${
                activeRoom?.id === room.id
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              {room.type === 'self' ? (
                <>
                  <Avatar user={currentUser} size="sm" />
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-semibold">{room.name}</span>
                      {unreadCount > 0 && (
                        <span className="ml-2 text-xs font-semibold text-white bg-red-500 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <RoomIcon room={room} />
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-semibold">{room.name}</span>
                      {unreadCount > 0 && (
                        <span className="ml-2 text-xs font-semibold text-white bg-red-500 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {isGroup && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {room.privacy === 'private'
                          ? <IconLock className="w-3 h-3" />
                          : <IconGlobe className="w-3 h-3" />
                        }
                        <code className="truncate">{room.id}</code>
                      </div>
                    )}
                  </div>
                </>
              )}
            </button>
            {isDeletable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Are you sure you want to delete the room "${room.name}"? This action cannot be undone.`)) {
                    deleteRoom(room.id);
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/50 transition-opacity"
                title="Delete room"
              >
                <IconTrash className="w-4 h-4 text-red-500" />
              </button>
            )}
          </div>
        )})}
      </nav>
      <JoinRoomModal 
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoin={joinRoom}
      />
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={createRoom}
      />
    </div>
  );
};

export default RoomList;
