import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { IconLogout, IconMoon, IconShare, IconSun, IconX } from './Icons';
import type { Settings } from '../hooks/useSettings';
import { toast } from '../hooks/useToast';

// Fix: Add a props interface for type safety.
interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  updateUser: (newDetails: Partial<Omit<User, 'id'>>) => void;
  logout: () => void;
  settings: Settings;
  toggleDarkMode: () => void;
  toggleEnterToSend: () => void;
}

const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose, currentUser, updateUser, logout, settings, toggleDarkMode, toggleEnterToSend }) => {
  const [name, setName] = useState(currentUser.name);
  const [saveStatus, setSaveStatus] = useState('');
  const [copyStatus, setCopyStatus] = useState('Copy Link');
  const [profilePicture, setProfilePicture] = useState<string | null>(currentUser.profilePicture || null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

  useEffect(() => {
    setName(currentUser.name);
    setSaveStatus('');
    setProfilePicture(currentUser.profilePicture || null);
  }, [currentUser, isOpen]);

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file.');
        return;
      }
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB.');
        return;
      }
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicture(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (name.trim()) {
        const updates: Partial<Omit<User, 'id'>> = { name };
        if (profilePictureFile) {
          // In a real app, you'd upload the file to a server and get back a URL
          // For now, we'll use the data URL as a placeholder
          updates.profilePicture = profilePicture;
        }
        updateUser(updates);
        setSaveStatus('Saved!');
        setTimeout(() => setSaveStatus(''), 2000);
        onClose(); // Close modal after saving
    } else {
        setSaveStatus('Name cannot be empty');
        setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  const handleCopyReferral = useCallback(() => {
      const referralLink = `${window.location.origin}?ref=${currentUser.id}`;
      navigator.clipboard.writeText(referralLink).then(() => {
          setCopyStatus('Copied!');
          setTimeout(() => setCopyStatus('Copy Link'), 2000);
      });
  }, [currentUser.id]);

  const handleShareReferral = useCallback(async () => {
      const referralLink = `${window.location.origin}?ref=${currentUser.id}`;
      if (navigator.share) {
          try {
              await navigator.share({
                  title: 'Invite to ChatSphere',
                  text: 'Join me on ChatSphere!',
                  url: referralLink,
              });
          } catch (error) {
              if (error instanceof DOMException && error.name !== 'AbortError') {
                  // Fallback to copy if share was cancelled or failed
                  navigator.clipboard.writeText(referralLink);
                  setCopyStatus('Copied!');
                  setTimeout(() => setCopyStatus('Copy Link'), 2000);
              }
          }
      } else {
          // Fallback for unsupported browsers
          navigator.clipboard.writeText(referralLink);
          setCopyStatus('Copied!');
          setTimeout(() => setCopyStatus('Copy Link'), 2000);
      }
  }, [currentUser.id]);

  if (!isOpen) return null;

  const isDarkMode = settings.theme === 'dark';
  const isSaved = saveStatus === 'Saved!';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold dark:text-white">Profile & Settings</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <IconX className="w-5 h-5 text-gray-600 dark:text-gray-300"/>
            </button>
        </div>
        <div className="p-6 space-y-6">
            {/* Profile Section */}
            <div>
                <h3 className="font-semibold mb-3 dark:text-gray-200">Profile</h3>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center cursor-pointer" onClick={() => document.getElementById('profile-picture-upload')?.click()}>
                        {profilePicture ? (
                            <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-gray-500 dark:text-gray-400 text-2xl">{currentUser.name.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <div className="flex-1">
                        <label htmlFor="username-settings" className="text-sm font-medium text-gray-600 dark:text-gray-400">Username</label>
                        <input id="username-settings" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                </div>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                    id="profile-picture-upload"
                />
            </div>

            {/* Settings Section */}
            <div>
                <h3 className="font-semibold mb-3 dark:text-gray-200">Settings</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Theme</span>
                        <button onClick={toggleDarkMode} className="p-2 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-400">
                            {isDarkMode ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
                        </button>
                    </div>

                     <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Enter to Send</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={settings.enterToSend} onChange={toggleEnterToSend} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Referral Section */}
            <div>
                <h3 className="font-semibold mb-2 dark:text-gray-200">Invite Friends</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Share this link to invite others to the app!</p>
                <div className="flex items-center gap-2">
                    <input type="text" readOnly value={`${window.location.origin}?ref=${currentUser.id}`} className="w-full mt-1 px-3 py-2 text-sm border rounded bg-gray-100 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-300" />
                    <button onClick={handleCopyReferral} className="flex items-center gap-2 px-3 py-2 mt-1 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 min-w-[110px] justify-center">
                       <IconShare className="w-4 h-4" /> {copyStatus}
                    </button>
                    <button onClick={handleShareReferral} className="flex items-center gap-2 px-3 py-2 mt-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 min-w-[80px] justify-center" title="Share via WhatsApp, etc.">
                       <IconShare className="w-4 h-4" /> Share
                    </button>
                </div>
            </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 flex justify-between items-center">
            <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50">
                <IconLogout className="w-5 h-5"/> Logout
            </button>
            <button 
                onClick={handleSave} 
                className={`px-4 py-2 text-sm font-medium text-white rounded-md min-w-[120px] transition-colors ${
                    isSaved 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
            >
                {saveStatus || 'Save Changes'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsModal;