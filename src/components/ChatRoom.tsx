import React, { useState } from 'react';
import type { User } from '../types';
import { useChat } from '../hooks/useChat';
import RoomList from './RoomList';
import ChatWindow from './ChatWindow';
import UserSettingsModal from './UserSettingsModal';
import UserSettingsTrigger from './UserSettingsTrigger';

import { MOCK_USERS } from '../constants';
import type { Settings } from '../hooks/useSettings';
import SearchResultsModal from './SearchResultsModal';

interface ChatRoomProps {
  user: User;
  updateUser: (newDetails: Partial<Omit<User, 'id'>>) => void;
  logout: () => void;
  settings: Settings;
  toggleDarkMode: () => void;
  toggleEnterToSend: () => void;
  onOpenLogin?: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({
  user,
  updateUser,
  logout,
  onOpenLogin,
  ...settingProps
}) => {
  const {
    rooms,
    activeRoom,
    setActiveRoom,
    sendMessage,
    sendPoll,
    handleVote,
    handleReaction,
    isSending,
    createRoom,
    joinRoom,
    activeTypingUsers,
    unreadCounts,
    deleteMessage,
    togglePinMessage,
    searchMessages,
    clearSearch,
    searchResults,
    isSearching,
    deleteRoom,
  } = useChat(user);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [jumpToMessageId, setJumpToMessageId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fix: Always get the latest room details from the `rooms` array to prevent stale state.
  const currentActiveRoom = activeRoom ? rooms.find((r) => r.id === activeRoom.id) : null;

  const activeRoomUsers = currentActiveRoom
    ? currentActiveRoom.users
        .map((userId) => MOCK_USERS[userId] || (userId === user.id ? user : undefined))
        .filter((u): u is User => !!u)
    : [];

  const handleSearch = (query: string, scope: 'current' | 'all') => {
    setSearchQuery(query);
    searchMessages(query, scope);
  };

  const handleJumpToMessage = (roomId: string, messageId: string) => {
    const targetRoom = rooms.find((r) => r.id === roomId);
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

  return (
    <div className={`flex flex-col md:flex-row h-screen bg-gray-50 dark:bg-gray-900`}>
      {/* Left Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-80 flex-shrink-0 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 md:h-screen md:overflow-hidden transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <h1 className="text-2xl font-bold mb-4 px-2 text-gray-800 dark:text-gray-100">
          ChatSphere
        </h1>
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

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsSidebarOpen(false);
            }
          }}
        ></div>
      )}

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
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            users={activeRoomUsers}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <p className="text-lg">Select a chat to start messaging</p>
          </div>
        )}
      </main>

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
    </div>
  );
};

export default ChatRoom;
