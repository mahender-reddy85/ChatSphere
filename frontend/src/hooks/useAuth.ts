import { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';

const FAKE_JWT_KEY = 'fake_jwt_token';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser && parsedUser.id) {
          setUser({
            id: parsedUser.id,
            username: parsedUser.username,
            name: parsedUser.name || parsedUser.username,
            profilePicture: parsedUser.profilePicture,
            isOnline: true,
          });
        }
      }
    } catch (error) {
      console.error('Failed to parse user data', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const { token, user: userData } = await response.json();
      localStorage.setItem('token', token);
      
      const newUser: User = {
        id: userData.id,
        username: userData.username,
        name: userData.name || userData.username,
        isOnline: true,
        profilePicture: userData.profilePicture,
      };
      
      // Store user data in a way that's accessible to our app
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error; // Re-throw to handle in the UI
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const updateUser = useCallback((newDetails: Partial<Omit<User, 'id'>>) => {
    setUser((currentUser) => {
      if (!currentUser) return null;
      const updatedUser = { ...currentUser, ...newDetails };

      try {
        const token = localStorage.getItem(FAKE_JWT_KEY);
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const newPayload = {
            ...payload,
            name: updatedUser.name,
            profilePicture: updatedUser.profilePicture,
          };
          const newToken = `header.${btoa(JSON.stringify(newPayload))}.signature`;
          localStorage.setItem(FAKE_JWT_KEY, newToken);
        }
      } catch (e) {
        console.error('Failed to update token', e);
      }

      return updatedUser;
    });
  }, []);

  return { user, login, logout, loading, updateUser };
};
