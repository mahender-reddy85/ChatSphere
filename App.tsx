import React, { useState } from 'react';
import ChatRoom from './components/ChatRoom';
import AuthForm from './components/AuthForm';
import { useAuth } from './hooks/useAuth';
import { useSettings } from './hooks/useSettings';

const App: React.FC = () => {
  // Fix: Destructure `login` from `useAuth` to pass it to the AuthForm.
  // This ensures a single source of truth for the authentication state.
  const { user, loading, login, updateUser, logout } = useAuth();
  const { settings, toggleDarkMode, toggleEnterToSend } = useSettings();

  const [showLoginPage, setShowLoginPage] = useState(false);

  const handleOpenLogin = () => {
    setShowLoginPage(true);
  };

  const handleLogin = (username: string) => {
    const success = login(username);
    if (success) {
      setShowLoginPage(false);
    }
    return success;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  const settingProps = {
    settings,
    toggleDarkMode,
    toggleEnterToSend,
  };

  return (
    <div className={`h-screen font-sans text-gray-800 dark:text-gray-200 overflow-hidden`}>
      {/* Fix: Pass the login and logout functions to child components. */}
      {user && !showLoginPage ? <ChatRoom user={user} updateUser={updateUser} logout={logout} onOpenLogin={handleOpenLogin} {...settingProps} /> : <AuthForm onLogin={handleLogin} />}
    </div>
  );
};

export default App;