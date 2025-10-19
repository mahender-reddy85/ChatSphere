import React, { useState } from 'react';
import { IconSearch } from './Icons';

interface SearchBarProps {
    onSearch: (query: string, scope: 'current' | 'all') => void;
    disabled: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, disabled }) => {
    const [query, setQuery] = useState('');
    const [scope, setScope] = useState<'current' | 'all'>('current');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query, scope);
    };

    return (
        <form onSubmit={handleSearch} className="px-2 mb-4">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search messages..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={disabled && scope === 'current'}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium">Search in:</span>
                 <div className="flex items-center border rounded-lg dark:border-gray-600 p-0.5">
                    <button type="button" onClick={() => setScope('current')} disabled={disabled} className={`px-2 py-0.5 rounded-md text-xs ${scope === 'current' ? 'bg-primary-500 text-white' : ''} disabled:opacity-50`}>
                        Current
                    </button>
                    <button type="button" onClick={() => setScope('all')} className={`px-2 py-0.5 rounded-md text-xs ${scope === 'all' ? 'bg-primary-500 text-white' : ''}`}>
                        All Chats
                    </button>
                </div>
            </div>
        </form>
    );
};

export default SearchBar;
