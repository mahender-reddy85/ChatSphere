import React from 'react';
import { IconVideo } from './Icons';

interface VideoCallButtonProps {
    roomId: string;
    onClick: () => void;
}

const VideoCallButton: React.FC<VideoCallButtonProps> = ({ roomId, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Start video call"
        >
            <IconVideo className="w-5 h-5" />
        </button>
    );
};

export default VideoCallButton;
