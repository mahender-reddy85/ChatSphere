import React from 'react';
import type { User } from '../types';
import { MOCK_USERS } from '../constants';
import Avatar from './Avatar';
import { IconVideo, IconPhoneOff } from './Icons';

interface IncomingCallModalProps {
    roomId: string;
    callerId: string;
    onAccept: () => void;
    onDecline: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({ roomId, callerId, onAccept, onDecline }) => {
    const caller = MOCK_USERS[callerId];

    if (!caller) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
                <div className="mx-auto mb-4">
                    <Avatar user={caller} size="lg" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">{caller.name}</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Incoming video call...</p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onDecline}
                        className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700"
                    >
                        <IconPhoneOff className="w-6 h-6" />
                    </button>
                    <button
                        onClick={onAccept}
                        className="p-4 rounded-full bg-green-600 text-white hover:bg-green-700"
                    >
                        <IconVideo className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallModal;
