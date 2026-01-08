import React from 'react';
import type { SearchResult } from '../types';
import Avatar from './Avatar';
import { IconX, IconChat, IconSearch } from './Icons';

interface SearchResultsModalProps {
    isOpen: boolean;
    onClose: () => void;
    results: SearchResult[];
    query: string;
    onJumpToMessage: (roomId: string, messageId: string) => void;
}

const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <mark key={i} className="bg-primary-200 dark:bg-primary-700 rounded px-0.5 text-black dark:text-white">
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </>
    );
};

const formatTimestamp = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(timestamp);
};

const SearchResultsModal: React.FC<SearchResultsModalProps> = ({ isOpen, onClose, results, query, onJumpToMessage }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start pt-16 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-semibold dark:text-white">Search Results for "{query}"</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <IconX className="w-5 h-5 text-gray-600 dark:text-gray-300"/>
                    </button>
                </div>
                <div className="p-2 overflow-y-auto flex-grow">
                    {results.length > 0 ? (
                        <ul className="space-y-1">
                            {results.map(({ message, roomId, roomName }) => (
                                <li key={message.id}>
                                    <button
                                        onClick={() => onJumpToMessage(roomId, message.id)}
                                        className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 text-left"
                                    >
                                        <Avatar user={message.author} size="md" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{message.author.name}</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimestamp(message.timestamp)}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                    <IconChat className="w-3 h-3" />
                                                    <span className="truncate">{roomName}</span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap break-words">
                                                {highlightText(message.text, query)}
                                            </p>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                            <IconSearch className="w-16 h-16 mb-4"/>
                            <p className="text-lg font-semibold">No results found</p>
                            <p>Try searching for something else.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchResultsModal;
