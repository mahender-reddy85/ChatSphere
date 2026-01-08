import React, { useState } from 'react';
import { IconAI } from './Icons';
import LoginModal from './LoginModal';

// Fix: Define props for the component to accept the login handler from its parent.
interface AuthFormProps {
  onLogin: (username: string) => boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [showLoginPage, setShowLoginPage] = useState(false);
  // Fix: Removed the local call to useAuth() to rely on the state from the App component.

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }
    setError('');
    // Fix: Use the onLogin prop to trigger authentication.
    onLogin(username);
  };

  const handleLoginClick = () => {
    setShowLoginPage(true);
  };

  const handleLoginModalClose = () => {
    setShowLoginPage(false);
  };

  const handlePasswordLogin = (loginUsername: string, password: string) => {
    // Placeholder for password login logic
    console.log('Password login:', loginUsername, password);
    // For now, just use the username to login
    onLogin(loginUsername);
    return true;
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg dark:bg-gray-800">
          <div className="flex flex-col items-center">
            <div className="p-3 mb-4 bg-primary-100 rounded-full dark:bg-primary-900/50">
               <IconAI className="w-10 h-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
              Welcome to ChatSphere
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Enter a username to join the chat
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="username" className="sr-only">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className="relative block w-full px-3 py-3 text-lg placeholder-gray-500 bg-gray-50 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  placeholder="Your Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleLoginClick}
                className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                Login
              </button>
              <button
                type="submit"
                className="px-4 py-3 text-lg font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-300"
              >
                Join Chat
              </button>
            </div>
          </form>
        </div>
      </div>

      <LoginModal
        isOpen={showLoginPage}
        onClose={handleLoginModalClose}
        onLogin={handlePasswordLogin}
      />
    </>
  );
};

export default AuthForm;