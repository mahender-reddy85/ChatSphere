import React, { useState, useEffect } from 'react';
import { IconX, IconShare, IconGlobe, IconLock } from './Icons';

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, privacy: 'public' | 'private', password?: string) => string;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [roomName, setRoomName] = useState('');
    const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
    const [copyStatus, setCopyStatus] = useState('Copy Code');
    const [privacy, setPrivacy] = useState<'public' | 'private'>('private');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (isOpen) {
            setRoomName('');
            setCreatedRoomId(null);
            setCopyStatus('Copy Code');
            setPrivacy('private');
            setPassword('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCreate = () => {
        if (roomName.trim()) {
            if (privacy === 'private' && password.length < 4) return;
            const newRoomId = onCreate(roomName.trim(), privacy, password);
            setCreatedRoomId(newRoomId);
        }
    };

    const handleCopy = () => {
        if (createdRoomId) {
            navigator.clipboard.writeText(createdRoomId);
            setCopyStatus('Copied!');
            setTimeout(() => setCopyStatus('Copy Code'), 2000);
        }
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={handleClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold dark:text-white">{createdRoomId ? 'Room Created!' : 'Create a New Room'}</h2>
                    <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <IconX className="w-5 h-5 text-gray-600 dark:text-gray-300"/>
                    </button>
                </div>

                {createdRoomId ? (
                    <div className="p-6 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Share this invite code with others:</p>
                        <div className="flex items-center gap-2">
                             <input type="text" readOnly value={createdRoomId} className="w-full mt-1 px-3 py-2 text-sm border rounded bg-gray-100 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-300" />
                            <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-2 mt-1 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 min-w-[120px] justify-center">
                               <IconShare className="w-4 h-4" /> {copyStatus}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="room-name" className="text-sm font-medium text-gray-600 dark:text-gray-400">Room Name</label>
                            <input 
                                id="room-name"
                                type="text" 
                                value={roomName} 
                                onChange={e => setRoomName(e.target.value)} 
                                placeholder="e.g., Project Alpha" 
                                className="w-full mt-1 px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                            />
                        </div>
                        {privacy === 'private' && (
                            <div>
                                <label htmlFor="room-password" className="text-sm font-medium text-gray-600 dark:text-gray-400">Room Password</label>
                                <input 
                                    id="room-password"
                                    type="password" 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    placeholder="Min. 4 characters" 
                                    className="w-full mt-1 px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                                />
                            </div>
                        )}
                        <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Privacy</label>
                            <div className="flex items-center gap-2 mt-2">
                                <button onClick={() => setPrivacy('private')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border ${privacy === 'private' ? 'bg-primary-500 text-white border-primary-500' : 'dark:border-gray-600'}`}>
                                    <IconLock className="w-4 h-4" /> Private
                                </button>
                                <button onClick={() => setPrivacy('public')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border ${privacy === 'public' ? 'bg-primary-500 text-white border-primary-500' : 'dark:border-gray-600'}`}>
                                    <IconGlobe className="w-4 h-4" /> Public
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 flex justify-end">
                     {createdRoomId ? (
                         <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">
                            Done
                        </button>
                     ) : (
                        <button 
                            onClick={handleCreate} 
                            disabled={!roomName.trim() || (privacy === 'private' && password.length < 4)}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-primary-300 dark:disabled:bg-primary-800"
                        >
                            Create Room
                        </button>
                     )}
                </div>
            </div>
        </div>
    );
};

export default CreateRoomModal;