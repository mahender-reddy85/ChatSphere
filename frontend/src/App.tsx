import React, { useState } from 'react';
import ChatRoom from './components/ChatRoom';
import AuthForm from './components/AuthForm';
import { useAuth } from './hooks/useAuth';
import { useSettings } from './hooks/useSettings';
import { ToastProvider } from './hooks/toastService';
import { authApi, type UserData } from './lib/api';

const App: React.FC = () => {
  const { user, loading, login, updateUser, logout } = useAuth();
  const { settings, toggleDarkMode, toggleEnterToSend } = useSettings();

  const [showLoginPage, setShowLoginPage] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleOpenLogin = () => {
    setShowLoginPage(true);
    setLoginError(null);
  };

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      const success = await login(username, password);
      if (success) {
        setShowLoginPage(false);
        setLoginError(null);
        return true;
      }
      return false;
    } catch (error: unknown) {
      console.error('Login failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setLoginError(errorMessage);
      return false;
    }
  };

  const handleRegister = async (username: string, password: string): Promise<boolean> => {
    try {
      const userData: UserData = { 
        username, 
        password,
        email: `${username}@example.com` // You might want to collect email separately
      };
      
      const response = await authApi.register(userData);
      if (response.data?.token) {
        return await handleLogin(username, password);
      }
      return false;
    } catch (error: unknown) {
      console.error('Registration failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      setLoginError(errorMessage);
      throw error;
    }
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
    <ToastProvider>
      <div className={`h-screen font-sans text-gray-800 dark:text-gray-200 overflow-hidden`}>
        {/* Fix: Pass the login and logout functions to child components. */}
        {user && !showLoginPage ? (
          <ChatRoom
            user={user}
            updateUser={updateUser}
            logout={logout}
            onOpenLogin={handleOpenLogin}
            {...settingProps}
          />
        ) : (
          <AuthForm 
            onLogin={handleLogin} 
            onRegister={handleRegister} 
            error={loginError} 
          />
        )}
      </div>
    </ToastProvider>
  );
};

export default App;
