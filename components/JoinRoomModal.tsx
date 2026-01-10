import React, { useState } from 'react';
import { IconX, IconLogin } from './Icons';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (
    roomId: string,
    password?: string
  ) => 'joined' | 'needs_password' | 'invalid_password' | 'not_found' | 'already_joined';
}

const JoinRoomModal: React.FC<JoinRoomModalProps> = ({ isOpen, onClose, onJoin }) => {
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'enter_id' | 'enter_password'>('enter_id');

  if (!isOpen) return null;

  const handleJoin = () => {
    if (!roomId.trim()) {
      setError('Please enter an invite code.');
      return;
    }
    setError('');

    if (step === 'enter_id') {
      const result = onJoin(roomId.trim());
      switch (result) {
        case 'joined':
          handleClose();
          break;
        case 'needs_password':
          setStep('enter_password');
          break;
        case 'not_found':
          setError('Invalid invite code.');
          break;
        case 'already_joined':
          setError('You are already in this room.');
          break;
      }
    } else if (step === 'enter_password') {
      const result = onJoin(roomId.trim(), password);
      switch (result) {
        case 'joined':
          handleClose();
          break;
        case 'invalid_password':
          setError('Incorrect password. Please try again.');
          setPassword('');
          break;
        default:
          setError('An unexpected error occurred. Please try again.');
          setStep('enter_id');
          break;
      }
    }
  };

  const handleClose = () => {
    setRoomId('');
    setPassword('');
    setError('');
    setStep('enter_id');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold dark:text-white">Join a Room</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <IconX className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label
              htmlFor="invite-code"
              className="text-sm font-medium text-gray-600 dark:text-gray-400"
            >
              Invite Code
            </label>
            <input
              id="invite-code"
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="e.g., project-alpha-abcd"
              disabled={step === 'enter_password'}
              className="w-full mt-1 px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-70 disabled:bg-gray-100 dark:disabled:bg-gray-700/50"
            />
          </div>
          {step === 'enter_password' && (
            <div>
              <label
                htmlFor="room-password"
                className="text-sm font-medium text-gray-600 dark:text-gray-400"
              >
                Room Password
              </label>
              <input
                id="room-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="This room is private"
                className="w-full mt-1 px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                autoFocus
              />
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 flex justify-end">
          <button
            onClick={handleJoin}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
          >
            <IconLogin className="w-5 h-5" />{' '}
            {step === 'enter_password' ? 'Enter Room' : 'Join Room'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinRoomModal;
