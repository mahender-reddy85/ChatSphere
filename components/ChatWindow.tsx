import React, { useRef, useEffect, useState } from 'react';
import type { Room, User, Message, MessageLocation } from '../types';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import PinnedMessagesBar from './PinnedMessagesBar';
import Avatar from './Avatar';
import UserList from './UserList';
import { IconUsers, IconAI, IconUser, IconMenu, IconX } from './Icons';

import type { Settings } from '../hooks/useSettings';

interface ChatWindowProps {
  room: Room;
  currentUser: User;
  sendMessage: (payload: { text: string; audio?: { blob: Blob; duration: number }; file?: File; location?: MessageLocation }, editingMessageId?: string, replyTo?: string) => void;
  sendPoll: (poll: { question: string; options: string[] }) => void;
  handleVote: (messageId: string, optionId: string) => void;
  handleReaction: (messageId: string, emoji: string) => void;
  deleteMessage: (messageId: string) => void;
  togglePinMessage: (messageId: string) => void;
  isSending: boolean;
  typingUsers: User[];
  settings: Settings;
  onOpenSettings: () => void;
  jumpToMessageId: string | null;
  onClearJump: () => void;
  onToggleSidebar?: () => void;
  users: User[];
}

const RoomIcon = ({ room }: { room: Room }) => {
    if (room.type === 'ai') {
        return <IconAI className="w-6 h-6 text-green-500" />;
    }
    if (room.type === 'self') {
        return <IconUser className="w-6 h-6 text-purple-500" />;
    }
    return <IconUsers className="w-6 h-6 text-blue-500" />;
};

const ChatWindow: React.FC<ChatWindowProps> = ({ room, currentUser, sendMessage, sendPoll, handleVote, handleReaction, deleteMessage, togglePinMessage, isSending, typingUsers, settings, onOpenSettings, jumpToMessageId, onClearJump, onToggleSidebar, users }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  
  // Debug: Log typing users
  useEffect(() => {
    console.log('Current typing users:', typingUsers);
  }, [typingUsers]);

  useEffect(() => {
    if (!jumpToMessageId) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [room.messages, jumpToMessageId]);
  
  useEffect(() => {
    if (jumpToMessageId) {
        const messageElement = document.getElementById(`message-${jumpToMessageId}`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedMessageId(jumpToMessageId);
            const timer = setTimeout(() => {
                setHighlightedMessageId(null);
            }, 2500); // Highlight for 2.5 seconds
            
            onClearJump(); // Reset jump state in parent
            return () => clearTimeout(timer);
        }
    }
  }, [jumpToMessageId, onClearJump]);

  const pinnedMessages = room.messages.filter(m => m.isPinned);

  const handleSendMessage = (payload: { text: string; audio?: { blob: Blob; duration: number }, file?: File, location?: MessageLocation }) => {
    sendMessage(payload, editingMessage?.id, replyingMessage?.id);
    if(editingMessage) {
        setEditingMessage(null);
    }
    if(replyingMessage) {
        setReplyingMessage(null);
    }
  }



  return (
    <div className="flex-1 flex flex-col h-full md:h-screen">
      <header className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10 flex-shrink-0">
        {onToggleSidebar && (
          <button onClick={onToggleSidebar} className="md:hidden p-2 mr-2 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-400">
            <IconMenu className="w-6 h-6" />
          </button>
        )}
        {room.type === 'self' || room.type === 'ai' ? (
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{room.name}</h2>
        ) : (
          <>
            <RoomIcon room={room} />
            <h2 className="text-lg font-semibold ml-3 text-gray-800 dark:text-gray-100 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300" onClick={() => setShowMembersModal(true)}>{room.name}</h2>
          </>
        )}
        <div className="ml-auto">
        </div>
      </header>
      




      {pinnedMessages.length > 0 && <PinnedMessagesBar messages={pinnedMessages} onUnpin={togglePinMessage} />}

      <div className="flex-1 overflow-y-auto p-4 bg-gray-100 dark:bg-gray-900">
        <div className="space-y-4">
          {room.messages.length === 0 && (
            <div className="flex justify-center items-center h-full">
                <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
            </div>
          )}
          {room.messages.map((message, index) => {
            const prevMessage: Message | undefined = room.messages[index-1];
            const isConsecutive = prevMessage && prevMessage.timestamp && message.timestamp && prevMessage.author?.id === message.author?.id && (message.timestamp - prevMessage.timestamp < 60000);
            return (
              <MessageBubble
                key={message.id}
                message={message}
                currentUser={currentUser}
                isConsecutive={!!isConsecutive}
                onVote={handleVote}
                onReaction={handleReaction}
                onDelete={deleteMessage}
                onSetEditingMessage={setEditingMessage}
                onTogglePin={togglePinMessage}
                onReply={setReplyingMessage}
                repliedToMessage={room.messages.find(m => m.id === message.replyTo)}
                isHighlighted={message.id === highlightedMessageId}
                roomType={room.type}
              />
            );
          })}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}

      <ChatInput
        onSendMessage={handleSendMessage}
        onCreatePoll={sendPoll}
        isSending={isSending}
        settings={settings}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
        onOpenSettings={onOpenSettings}
        replyingMessage={replyingMessage}
        onCancelReply={() => setReplyingMessage(null)}
        currentUser={currentUser}
        room={room}
      />

      {/* Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={() => setShowMembersModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold dark:text-white">Members</h2>
              <button onClick={() => setShowMembersModal(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <IconX className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            <div className="p-4">
              <UserList users={users} title="" roomId={room.id} currentUser={currentUser} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;