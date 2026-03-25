import { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';

const TOKEN_KEY = 'chatsphere_auth_token';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://chatsphere-7t8g.onrender.com';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize: Load user from token in localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const resp = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (resp.ok) {
          const data = await resp.json();
          if (data.success) {
            setUser({
              id: data.user.id,
              name: data.user.name || data.user.username,
              profilePicture: data.user.profile_picture,
              isOnline: true,
            });
          }
        } else {
          // Token expired or invalid
          localStorage.removeItem(TOKEN_KEY);
        }
      } catch (err) {
        console.error('Initial auth failed', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (username: string, password = 'password123'): Promise<boolean> => {
    try {
      // For this app, we'll try to login first, if failed, try to register
      let resp = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!resp.ok) {
        // Try register
        resp = await fetch(`${BACKEND_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
      }

      if (resp.ok) {
        const data = await resp.json();
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem('token', data.token); // compat with useChat.ts
        setUser({
          id: data.user.id,
          name: data.user.name || data.user.username,
          isOnline: true,
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login/Register failed', err);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const updateUser = useCallback(async (newDetails: Partial<Omit<User, 'id'>>) => {
     // Local update for now
     setUser(prev => prev ? { ...prev, ...newDetails } : null);
     // Note: In production, you would PATCH /api/auth/me here
  }, []);

  return { user, login, logout, loading, updateUser };
};
