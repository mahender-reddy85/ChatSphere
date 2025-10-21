import React, { useEffect, useRef } from 'react';

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '+'];

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return (
        <div 
            ref={pickerRef}
            className="absolute z-20 bottom-full mb-2 bg-white dark:bg-gray-800 rounded-full shadow-lg p-1 flex items-center gap-1 border dark:border-gray-700"
        >
            {EMOJIS.map(emoji => (
                <button 
                    key={emoji} 
                    onClick={() => onSelect(emoji)} 
                    className="p-1.5 text-xl rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
};

export default EmojiPicker;
