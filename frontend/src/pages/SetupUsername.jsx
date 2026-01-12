import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, getUser, setAuth } from '../lib/auth';
import { api } from '../lib/api';

export default function SetupUsername() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home if already has username
    const user = getUser();
    if (user?.username) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim()) {
      return setError('Please enter a username');
    }
    
    if (username.trim().length < 3) {
      return setError('Username must be at least 3 characters long');
    }

    setIsLoading(true);

    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Update user's username
      const updatedUser = await api('/api/auth/username', {
        method: 'PUT',
        body: JSON.stringify({ username: username.trim() })
      });

      // Update auth with new user data
      setAuth(token, updatedUser);
      
      // Redirect to home
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to set username. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Choose a Username
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please choose a username to continue to ChatSphere
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter your username"
              disabled={isLoading}
              autoComplete="username"
              minLength={3}
              required
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {isLoading ? 'Saving...' : 'Continue to Chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
