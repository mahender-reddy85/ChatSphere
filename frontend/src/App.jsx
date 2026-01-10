import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getToken, getUser, clearAuth } from './lib/auth';
import { api } from './lib/api';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

// Main App component with authentication context
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
  const [user, setUser] = useState(getUser());
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Verify token with backend
        const userData = await api('/api/auth/me');
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Authentication error:', error);
        clearAuth();
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    clearAuth();
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/login';
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login />
        } />
        
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Register />
        } />
        
        <Route path="/" element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-100">
              {/* Navigation */}
              <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between h-16">
                    <div className="flex items-center">
                      <h1 className="text-xl font-bold text-gray-900">ChatSphere</h1>
                    </div>
                    <div className="flex items-center">
                      {user && (
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-700">
                            Welcome, {user.username}
                          </span>
                          <button
                            onClick={handleLogout}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Logout
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </nav>

              {/* Main content */}
              <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                  <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4">
                    <h2 className="text-2xl font-bold mb-4">Welcome to ChatSphere</h2>
                    <p className="text-gray-600">
                      {user ? `You are logged in as ${user.username}` : 'Please log in to continue'}
                    </p>
                  </div>
                </div>
              </main>
            </div>
          </ProtectedRoute>
        } />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
