import React, { useState, useRef, useEffect } from 'react';
import type { Message, User } from '../types';
import { IconDots, IconSmile, IconEdit, IconTrash, IconCopy, IconPin, IconX, IconReply } from './Icons';
import EmojiPicker from './EmojiPicker';

interface MessageActionsProps {
    message: Message;
    currentUser: User;
    onReact: (emoji: string) => void;
    onEdit: (message: Message) => void;
    onDelete: (messageId: string, type?: 'for_me' | 'for_everyone' | 'permanent') => void;
    onTogglePin: (messageId: string) => void;
    onReply: (message: Message) => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({ message, currentUser, onReact, onEdit, onDelete, onTogglePin, onReply }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [isDeleteMenuOpen, setIsDeleteMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const isCurrentUserMessage = message.author?.id === currentUser.id;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.text);
        setIsMenuOpen(false);
    };

    const handleDeleteClick = () => {
        setIsDeleteMenuOpen(true);
        setIsMenuOpen(false);
    };

    const handleDeleteForMe = () => {
        onDelete(message.id, 'for_me');
        setIsDeleteMenuOpen(false);
    };

    const handleDeleteForEveryone = () => {
        onDelete(message.id, 'for_everyone');
        setIsDeleteMenuOpen(false);
    };

    return (
        <div className="relative flex items-center" ref={menuRef}>
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 md:group-hover:opacity-100 md:opacity-0 opacity-100 transition-opacity flex items-center gap-1 bg-gray-200 dark:bg-gray-600 p-1 rounded-full">
                <button onClick={() => setIsEmojiPickerOpen(true)} className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 touch-manipulation">
                    <IconSmile className="w-5 h-5" />
                </button>
                <button onClick={() => setIsMenuOpen(true)} className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 touch-manipulation">
                    <IconDots className="w-5 h-5" />
                </button>
            </div>
            
            {isEmojiPickerOpen && (
                <div className="absolute top-full right-0 mt-2 z-10">
                    <EmojiPicker onSelect={(emoji) => { onReact(emoji); setIsEmojiPickerOpen(false); }} onClose={() => setIsEmojiPickerOpen(false)} />
                </div>
            )}

            {isMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border dark:border-gray-600 p-2 z-10">
                    <button onClick={handleCopy} className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-sm">
                        <IconCopy className="w-4 h-4" /> Copy Text
                    </button>
                    <button onClick={() => { onTogglePin(message.id); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-sm">
                        <IconPin className="w-4 h-4" /> {message.isPinned ? 'Unpin Message' : 'Pin Message'}
                    </button>
                    <button onClick={() => { onReply(message); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-sm">
                        <IconReply className="w-4 h-4" /> Reply
                    </button>
                    {isCurrentUserMessage && (
                        <>
                            <div className="my-1 h-px bg-gray-200 dark:bg-gray-600" />
                            {Date.now() - message.timestamp <= 900000 && ( // 15 minutes = 900000ms
                                <button onClick={() => { onEdit(message); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-sm">
                                    <IconEdit className="w-4 h-4" /> Edit Message
                                </button>
                            )}
                             <button onClick={handleDeleteClick} className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-sm text-red-600 dark:text-red-400">
                                <IconTrash className="w-4 h-4" /> Delete Message
                            </button>
                        </>
                    )}
                </div>
            )}

            {isDeleteMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border dark:border-gray-600 p-2 z-10">
                    <div className="flex items-center justify-between px-3 py-2 border-b dark:border-gray-600">
                        <span className="text-sm font-medium">Delete Message</span>
                        <button onClick={() => setIsDeleteMenuOpen(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600">
                            <IconX className="w-4 h-4" />
                        </button>
                    </div>
                    <button onClick={handleDeleteForMe} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-sm">
                        <IconTrash className="w-4 h-4" /> Delete for me
                    </button>
                    <button onClick={handleDeleteForEveryone} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-sm text-red-600 dark:text-red-400">
                        <IconTrash className="w-4 h-4" /> Delete for everyone
                    </button>
                    {message.isDeleted && (
                        <button onClick={() => { onDelete(message.id, 'permanent'); setIsDeleteMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-sm text-red-600 dark:text-red-400">
                            <IconTrash className="w-4 h-4" /> Delete permanently
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default MessageActions;
