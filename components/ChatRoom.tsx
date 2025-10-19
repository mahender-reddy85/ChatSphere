import React, { useState } from 'react';
import type { User } from '../types';
import { useChat } from '../hooks/useChat';
import RoomList from './RoomList';
import ChatWindow from './ChatWindow';
import UserSettingsModal from './UserSettingsModal';
import UserSettingsTrigger from './UserSettingsTrigger';
import UserList from './UserList';
import Avatar from './Avatar';
import { MOCK_USERS } from '../constants';
import type { Settings, FontSize } from '../hooks/useSettings';
import SearchResultsModal from './SearchResultsModal';
import VideoCallModal from './VideoCallModal';

interface ChatRoomProps {
  user: User;
  updateUser: (newDetails: Partial<Omit<User, 'id'>>) => void;
  logout: () => void;
  settings: Settings;
  toggleDarkMode: () => void;
  setFontSize: (size: FontSize) => void;
  toggleEnterToSend: () => void;
  onOpenLogin?: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ user, updateUser, logout, onOpenLogin, ...settingProps }) => {
  const { rooms, activeRoom, setActiveRoom, sendMessage, sendPoll, handleVote, handleReaction, isSending, createRoom, joinRoom, activeTypingUsers, unreadCounts, deleteMessage, togglePinMessage, searchMessages, clearSearch, searchResults, isSearching, startVideoCall, joinVideoCall, leaveVideoCall, deleteRoom } = useChat(user);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [jumpToMessageId, setJumpToMessageId] = useState<string | null>(null);

  // Fix: Always get the latest room details from the `rooms` array to prevent stale state.
  const currentActiveRoom = activeRoom ? rooms.find(r => r.id === activeRoom.id) : null;

  const activeRoomUsers = currentActiveRoom ? currentActiveRoom.users.map(userId => MOCK_USERS[userId] || (userId === user.id ? user : undefined)).filter((u): u is User => !!u) : [];

  const handleSearch = (query: string, scope: 'current' | 'all') => {
      setSearchQuery(query);
      searchMessages(query, scope);
  };

  const handleJumpToMessage = (roomId: string, messageId: string) => {
    const targetRoom = rooms.find(r => r.id === roomId);
    if (targetRoom) {
        if (activeRoom?.id !== roomId) {
            setActiveRoom(targetRoom);
        }
        setJumpToMessageId(messageId);
        clearSearch();
        setSearchQuery('');
    }
  };

  const handleClearJump = () => {
      setJumpToMessageId(null);
  };

  const isUserInCall = currentActiveRoom?.activeCall?.participants.includes(user.id) ?? false;

  return (
    <div className={`flex flex-col md:flex-row h-screen bg-gray-50 dark:bg-gray-900`}>
      {/* Left Sidebar */}
      <aside className="w-full md:w-80 flex-shrink-0 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 md:h-screen md:overflow-hidden">
        <h1 className="text-2xl font-bold mb-4 px-2 text-gray-800 dark:text-gray-100">ChatSphere</h1>
        <RoomList
          rooms={rooms}
          activeRoom={activeRoom}
          setActiveRoom={setActiveRoom}
          createRoom={createRoom}
          joinRoom={joinRoom}
          deleteRoom={deleteRoom}
          unreadCounts={unreadCounts}
          onSearch={handleSearch}
          currentUser={user}
        />
        <div className="mt-auto">
            <UserSettingsTrigger
              currentUser={user}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              onOpenLogin={onOpenLogin}
            />
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full md:h-screen">
        {currentActiveRoom ? (
          <ChatWindow
            key={currentActiveRoom.id}
            room={currentActiveRoom}
            currentUser={user}
            sendMessage={sendMessage}
            sendPoll={sendPoll}
            handleVote={handleVote}
            handleReaction={handleReaction}
            deleteMessage={deleteMessage}
            togglePinMessage={togglePinMessage}
            isSending={isSending}
            typingUsers={activeTypingUsers}
            settings={settingProps.settings}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            jumpToMessageId={jumpToMessageId}
            onClearJump={handleClearJump}
            onStartVideoCall={() => startVideoCall(currentActiveRoom.id)}
            onJoinVideoCall={() => joinVideoCall(currentActiveRoom.id)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <p className="text-lg">Select a chat to start messaging</p>
          </div>
        )}
      </main>

      {/* Right Sidebar */}
      {currentActiveRoom && currentActiveRoom.type === 'group' && (
         <aside className="w-full md:w-72 flex-shrink-0 flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 md:h-screen md:overflow-hidden">
          <UserList users={activeRoomUsers} title="Members" roomId={currentActiveRoom.id} currentUser={user}/>
         </aside>
      )}

      {/* Settings Modal */}
      <UserSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentUser={user}
        updateUser={updateUser}
        logout={logout}
        {...settingProps}
      />

      {/* Search Results Modal */}
      <SearchResultsModal
        isOpen={isSearching}
        onClose={clearSearch}
        results={searchResults}
        query={searchQuery}
        onJumpToMessage={handleJumpToMessage}
      />

      {/* Video Call Modal */}
      {currentActiveRoom && isUserInCall && (
        <VideoCallModal
            room={currentActiveRoom}
            currentUser={user}
            onLeaveCall={() => leaveVideoCall(currentActiveRoom.id)}
        />
      )}
    </div>
  );
};

export default ChatRoom;
