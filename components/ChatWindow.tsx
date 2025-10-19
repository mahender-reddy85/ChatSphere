import React, { useRef, useEffect, useState } from 'react';
import type { Room, User, Message, MessageLocation } from '../types';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import PinnedMessagesBar from './PinnedMessagesBar';
import Avatar from './Avatar';
import { IconUsers, IconAI, IconUser, IconVideo } from './Icons';
import type { Settings } from '../hooks/useSettings';
import ActiveCallBanner from './ActiveCallBanner';

interface ChatWindowProps {
  room: Room;
  currentUser: User;
  sendMessage: (payload: { text: string; audio?: { blob: Blob; duration: number }; file?: File, location?: MessageLocation }, editingMessageId?: string) => void;
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
  onStartVideoCall: () => void;
  onJoinVideoCall: () => void;
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

const ChatWindow: React.FC<ChatWindowProps> = ({ room, currentUser, sendMessage, sendPoll, handleVote, handleReaction, deleteMessage, togglePinMessage, isSending, typingUsers, settings, onOpenSettings, jumpToMessageId, onClearJump, onStartVideoCall, onJoinVideoCall }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);

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
  
  const isUserInCall = room.activeCall?.participants.includes(currentUser.id) ?? false;

  return (
    <div className="flex-1 flex flex-col h-screen">
      <header className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10 flex-shrink-0">
        {room.type === 'self' ? (
          <>
            <Avatar user={currentUser} size="md" />
            <h2 className="text-lg font-semibold ml-3 text-gray-800 dark:text-gray-100">{room.name}</h2>
          </>
        ) : (
          <>
            <RoomIcon room={room} />
            <h2 className="text-lg font-semibold ml-3 text-gray-800 dark:text-gray-100">{room.name}</h2>
          </>
        )}
        <div className="ml-auto">
            {room.type === 'group' && !room.activeCall && (
                <button onClick={onStartVideoCall} className="p-2 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-400">
                    <IconVideo className="w-6 h-6" />
                </button>
            )}
        </div>
      </header>
      
      {room.activeCall && !isUserInCall && (
        <ActiveCallBanner room={room} onJoin={onJoinVideoCall} currentUser={currentUser} />
      )}

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
            const isConsecutive = prevMessage && prevMessage.author.id === message.author.id && (message.timestamp - prevMessage.timestamp < 60000);
            return (
              <MessageBubble
                key={message.id}
                message={message}
                currentUser={currentUser}
                isConsecutive={isConsecutive}
                onVote={handleVote}
                onReaction={handleReaction}
                onDelete={deleteMessage}
                onSetEditingMessage={setEditingMessage}
                onTogglePin={togglePinMessage}
                onReply={setReplyingMessage}
                repliedToMessage={room.messages.find(m => m.id === message.replyTo)}
                isHighlighted={message.id === highlightedMessageId}
              />
            );
          })}
        </div>
        <div ref={messagesEndRef} />
      </div>

      <TypingIndicator users={typingUsers} />

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
      />
    </div>
  );
};

export default ChatWindow;