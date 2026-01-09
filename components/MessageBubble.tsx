import React, { useState, useRef, useEffect } from 'react';
import type { Message, User, MessageLocation } from '../types';
import Avatar from './Avatar';
import PollDisplay from './PollDisplay';
import ImageModal from './ImageModal';
import EmojiPicker from './EmojiPicker';
import { IconFile, IconMapPin, IconTrash, IconCheck, IconDoubleCheck, IconSmile, IconDots, IconCopy, IconPin, IconReply, IconEdit, IconX } from './Icons';

interface MessageBubbleProps {
    message: Message;
    currentUser: User;
    isConsecutive: boolean;
    onVote: (messageId: string, optionId: string) => void;
    onReaction: (messageId: string, emoji: string) => void;
    onDelete: (messageId: string, type?: 'for_me' | 'for_everyone' | 'permanent') => void;
    onSetEditingMessage: (message: Message) => void;
    onTogglePin: (messageId: string) => void;
    onReply: (message: Message) => void;
    repliedToMessage?: Message;
    isHighlighted?: boolean;
    roomType?: string;
}

const formatTimestamp = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(timestamp);
}

const FileAttachment = ({ file, onImageClick }: { file: NonNullable<Message['file']>, onImageClick: (url: string, name?: string) => void }) => {
    if (file.type.startsWith('image/')) {
        return <img src={file.url} alt={file.name} className="max-w-xs max-h-64 rounded-lg mt-2 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => onImageClick(file.url, file.name)} />;
    }
    if (file.type.startsWith('video/')) {
        return <video src={file.url} controls className="max-w-xs rounded-lg mt-2" />;
    }
    if (file.type.startsWith('audio/')) {
        return <audio src={file.url} controls className="w-full mt-2" />;
    }
    return (
        <a href={file.url} download={file.name} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-gray-200 dark:bg-gray-800 p-2 rounded-lg mt-2 hover:bg-gray-300 dark:hover:bg-gray-700">
            <IconFile className="w-6 h-6 flex-shrink-0" />
            <span className="truncate text-sm font-medium">{file.name}</span>
        </a>
    );
}

const AudioAttachment = ({ audio, isCurrentUserMessage }: { audio: NonNullable<Message['audio']>, isCurrentUserMessage: boolean }) => {
    return (
        <div className="w-64">
            <audio controls src={audio.url} className={`w-full ${isCurrentUserMessage ? 'filter-audio-white' : ''}`}></audio>
             <style>{`
                .filter-audio-white {
                    filter: invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(1000%) contrast(100%);
                }
            `}</style>
        </div>
    );
};

const LocationAttachment = ({ location }: { location: MessageLocation }) => {
    const mapUrl = `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=16/${location.latitude}/${location.longitude}`;
    const staticMapImageUrl = `https://maps.wikimedia.org/osm-intl/16/${location.latitude}/${location.longitude}.png?lang=en`;

    return (
        <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="block w-64 h-40 rounded-lg overflow-hidden relative text-white no-underline border border-black/20">
            <img src={staticMapImageUrl} alt="Map view of a location" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-2">
                <p className="font-semibold text-sm">Location Shared</p>
                <p className="text-xs">{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
            </div>
        </a>
    );
};


const MessageBubble: React.FC<MessageBubbleProps> = ({ message, currentUser, isConsecutive, onVote, onReaction, onDelete, onSetEditingMessage, onTogglePin, onReply, repliedToMessage, isHighlighted, roomType }) => {
    const isCurrentUserMessage = message.author?.id === currentUser.id;

    // If message is deleted for everyone, show deleted message
    if (message.isDeleted && message.deletedForEveryone) {
        const isDeletedByMe = message.deletedBy === currentUser.id;
        return (
            <div className={`flex items-start gap-3 group transition-colors duration-1000 ${isCurrentUserMessage ? 'flex-row-reverse' : ''} ${isHighlighted ? 'bg-primary-100/50 dark:bg-primary-900/40 rounded-lg' : ''}`}>
                {!isCurrentUserMessage && message.author && (
                    <div className={`flex-shrink-0 self-end ${isConsecutive ? 'opacity-0' : ''}`}>
                        <Avatar user={message.author} size="md" />
                    </div>
                )}
                <div className={`flex flex-col max-w-full ${isCurrentUserMessage ? 'items-end' : 'items-start'}`}>
                    {!isConsecutive && message.author && (
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{message.author.name}</span>
                        </div>
                    )}
                    <div className="max-w-md lg:max-w-lg rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-4 py-2.5 italic flex items-center">
                        <button onClick={() => onDelete(message.id, 'permanent')} className="mr-2 p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600">
                            <IconTrash className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                        <span>{isDeletedByMe ? 'You deleted this message' : 'This message was deleted'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimestamp(message.timestamp)}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // System message
    if (message.type === 'system') {
        return (
            <div className="flex justify-center my-2">
                <div className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-full text-sm">
                    {message.text}
                </div>
            </div>
        );
    }
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState('');
    const [selectedImageName, setSelectedImageName] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [isDeleteMenuOpen, setIsDeleteMenuOpen] = useState(false);
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const menuRef = useRef<HTMLDivElement>(null);
    const emojiRef = useRef<HTMLDivElement>(null);
    const deleteRef = useRef<HTMLDivElement>(null);
    const messageContentRef = useRef<HTMLDivElement>(null);
    const longPressTimer = useRef<number | null>(null);
    const isLongPressing = useRef(false);

    // Handle click outside for all menus
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
            if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
                setIsEmojiPickerOpen(false);
            }
            if (deleteRef.current && !deleteRef.current.contains(event.target as Node)) {
                setIsDeleteMenuOpen(false);
            }
            if (showContextMenu) {
                setShowContextMenu(false);
            }
        };

        // Prevent context menu on the document
        const handleContextMenu = (e: MouseEvent) => {
            if ((e.target as HTMLElement).closest('.message-content')) {
                e.preventDefault();
                setContextMenuPosition({ x: e.clientX, y: e.clientY });
                setShowContextMenu(true);
                setIsMenuOpen(false);
                setIsEmojiPickerOpen(false);
            }
        };

        // Handle long press on mobile
        const handleTouchStart = (e: TouchEvent) => {
            if ((e.target as HTMLElement).closest('.message-content')) {
                isLongPressing.current = true;
                const touch = e.touches[0];
                const target = e.target as HTMLElement;
                const rect = target.getBoundingClientRect();
                
                longPressTimer.current = window.setTimeout(() => {
                    if (isLongPressing.current) {
                        setContextMenuPosition({ 
                            x: touch.clientX, 
                            y: touch.clientY 
                        });
                        setShowContextMenu(true);
                        setIsMenuOpen(false);
                        setIsEmojiPickerOpen(false);
                    }
                }, 500); // 500ms for long press
            }
        };

        const handleTouchEnd = () => {
            isLongPressing.current = false;
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
            }
        };

        const handleTouchMove = () => {
            isLongPressing.current = false;
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
            }
        };

        // Prevent text selection when long pressing
        const handleSelectStart = (e: Event) => {
            if (isLongPressing.current) {
                e.preventDefault();
                return false;
            }
            return true;
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('selectstart', handleSelectStart);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('selectstart', handleSelectStart);
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
            }
        };
    }, [showContextMenu]);

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

    const handleVote = (optionId: string) => {
        onVote(message.id, optionId);
    };

    const handleReaction = (emoji: string) => {
        onReaction(message.id, emoji);
    }

    const handleImageClick = (url: string, name?: string) => {
        setSelectedImageUrl(url);
        setSelectedImageName(name || '');
        setImageModalOpen(true);
    };

    const containerClasses = `flex items-start gap-2 sm:gap-3 group transition-colors duration-1000 ${isCurrentUserMessage ? 'flex-row-reverse' : ''} ${isHighlighted ? 'bg-primary-100/50 dark:bg-primary-900/40 rounded-lg' : ''}`;
    const bubbleClasses = `max-w-[280px] sm:max-w-md lg:max-w-lg rounded-2xl ${
        isCurrentUserMessage
        ? 'bg-primary-600 text-white rounded-br-lg'
        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-lg'
    } ${message.text || message.poll ? 'px-3 py-2 sm:px-4 sm:py-2.5' : 'p-1.5'} text-sm sm:text-base`;
    const reactionContainer = `flex flex-wrap items-center gap-1 mt-1 ${isCurrentUserMessage ? 'justify-end' : 'justify-start'} max-w-[280px] sm:max-w-md lg:max-w-lg`;

    return (
        <div id={`message-${message.id}`} className={containerClasses}>
            {(roomType !== 'self' && roomType !== 'ai') && message.author && (
                <div className={`flex-shrink-0 self-end ${isConsecutive ? 'opacity-0' : ''}`}>
                    <Avatar user={isCurrentUserMessage ? currentUser : message.author} size="md" />
                </div>
            )}

            <div className={`flex flex-col max-w-full ${isCurrentUserMessage ? 'items-end' : 'items-start'}`}>
                {!isConsecutive && (
                    <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {isCurrentUserMessage ? formatTimestamp(message.timestamp) : message.author?.name}
                        </span>
                    </div>
                )}

                <div 
                    className={`${bubbleClasses} message-content`}
                    ref={messageContentRef}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenuPosition({ x: e.clientX, y: e.clientY });
                        setShowContextMenu(true);
                    }}
                >
                    {message.replyTo && repliedToMessage && (
                        <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-600 rounded border-l-4 border-blue-500">
                            <p className="text-xs text-gray-600 dark:text-gray-400">Replying to {repliedToMessage.author?.name}</p>
                            <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{repliedToMessage.text}</p>
                        </div>
                    )}
                    {message.location && <LocationAttachment location={message.location} />}
                    {message.audio ? (
                       <AudioAttachment audio={message.audio} isCurrentUserMessage={isCurrentUserMessage} />
                    ) : message.file ? (
                       <FileAttachment file={message.file} onImageClick={handleImageClick} />
                    ) : null}

                    {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}

                    {message.poll && (
                       <PollDisplay
                            poll={message.poll}
                            currentUser={currentUser}
                            onVote={handleVote}
                            isCurrentUserMessage={isCurrentUserMessage}
                       />
                    )}
                </div>
                {showContextMenu && (
                    <div 
                        className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-600 py-1"
                        style={{
                            left: `${contextMenuPosition.x}px`,
                            top: `${contextMenuPosition.y}px`,
                            transform: 'translateY(-100%)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => {
                                setIsEmojiPickerOpen(true);
                                setShowContextMenu(false);
                            }} 
                            className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                        >
                            <IconSmile className="w-4 h-4" /> Add Reaction
                        </button>
                        <button 
                            onClick={() => {
                                onReply(message);
                                setShowContextMenu(false);
                            }} 
                            className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                        >
                            <IconReply className="w-4 h-4" /> Reply
                        </button>
                        {isCurrentUserMessage && (
                            <>
                                <div className="my-1 h-px bg-gray-200 dark:bg-gray-600" />
                                <button 
                                    onClick={() => {
                                        onSetEditingMessage(message);
                                        setShowContextMenu(false);
                                    }} 
                                    className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                                >
                                    <IconEdit className="w-4 h-4" /> Edit
                                </button>
                                <button 
                                    onClick={() => {
                                        setIsDeleteMenuOpen(true);
                                        setShowContextMenu(false);
                                    }} 
                                    className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 text-sm"
                                >
                                    <IconTrash className="w-4 h-4" /> Delete
                                </button>
                            </>
                        )}
                    </div>
                )}
                <div className={`flex ${isCurrentUserMessage ? 'justify-end' : 'justify-start'} mt-1`}>
                    <div className="flex items-center gap-1">
                        <div className="relative">
                            <button onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)} className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 min-w-[40px] min-h-[40px] flex items-center justify-center touch-manipulation">
                                <IconSmile className="w-5 h-5" />
                            </button>
                            {isEmojiPickerOpen && (
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-10">
                                    <EmojiPicker onSelect={(emoji) => { onReaction(message.id, emoji); setIsEmojiPickerOpen(false); }} onClose={() => setIsEmojiPickerOpen(false)} />
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 min-w-[40px] min-h-[40px] flex items-center justify-center touch-manipulation">
                                <IconDots className="w-5 h-5" />
                            </button>
                            {isMenuOpen && (
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border dark:border-gray-600 p-2 z-50" ref={menuRef}>
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
                                                <button onClick={() => { onSetEditingMessage(message); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-sm">
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
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border dark:border-gray-600 p-2 z-50" ref={deleteRef}>
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
                    </div>
                </div>
                
                 <div className="flex flex-col gap-1 mt-1 px-1">
                    <div className={`flex items-center gap-2 ${isCurrentUserMessage ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {message.isEdited && "Edited "}
                            {isCurrentUserMessage && message.status === 'seen' && 'Seen'}
                        </span>
                        {isCurrentUserMessage && message.status && (
                            <div className="flex items-center gap-1 ml-2">
                                {message.status === 'sent' && <IconCheck className="w-3 h-3 text-gray-400" />}
                                {message.status === 'delivered' && <IconDoubleCheck className="w-3 h-3 text-gray-400" />}
                                {message.status === 'seen' && <IconDoubleCheck className="w-3 h-3 text-blue-500" />}
                            </div>
                        )}
                    </div>
                    {message.reactions && message.reactions.length > 0 && (
                        <div className={`${reactionContainer} overflow-x-auto`}>
                            {message.reactions.map(reaction => (
                                <div key={reaction.emoji} className="flex items-center gap-1 px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-full text-xs touch-manipulation flex-shrink-0">
                                    <span>{reaction.emoji}</span>
                                    <span className="font-semibold text-gray-700 dark:text-gray-200">{reaction.users.length}</span>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>
            </div>

            <ImageModal
                isOpen={imageModalOpen}
                onClose={() => setImageModalOpen(false)}
                imageUrl={selectedImageUrl}
                imageName={selectedImageName}
            />
        </div>
    );
};

export default MessageBubble;