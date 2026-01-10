import React from 'react';
import type { Room, User } from '../types';
import { MOCK_USERS } from '../constants';
import Avatar from './Avatar';
import { IconVideo } from './Icons';

interface ActiveCallBannerProps {
  room: Room;
  onJoin: () => void;
  currentUser: User;
}

const ActiveCallBanner: React.FC<ActiveCallBannerProps> = ({ room, onJoin, currentUser }) => {
  if (!room.activeCall) return null;

  const participants = room.activeCall.participants
    .map((id) => MOCK_USERS[id] || (id === currentUser.id ? currentUser : null))
    .filter((u): u is User => u !== null);

  const displayParticipants = participants.slice(0, 3);
  const remainingCount = participants.length - displayParticipants.length;

  return (
    <div className="p-2 bg-green-50 dark:bg-green-900/40 border-b border-green-200 dark:border-green-800 flex-shrink-0 animate-pulse-fast">
      <div className="flex items-center justify-between text-sm max-w-full mx-auto px-2">
        <div className="flex items-center min-w-0">
          <IconVideo className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div className="ml-3 flex items-center -space-x-2">
            {displayParticipants.map((p) => (
              <Avatar key={p.id} user={p} size="xs" />
            ))}
          </div>
          <p className="ml-3 text-sm font-medium text-green-800 dark:text-green-200 truncate">
            {participants.length} {participants.length === 1 ? 'person' : 'people'} in the call
            {remainingCount > 0 && ` (+${remainingCount} more)`}
          </p>
        </div>
        <button
          onClick={onJoin}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700"
        >
          Join Call
        </button>
      </div>
      <style>{`.animate-pulse-fast { animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }`}</style>
    </div>
  );
};

export default ActiveCallBanner;
