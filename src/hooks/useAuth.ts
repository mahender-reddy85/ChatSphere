import { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';

const FAKE_JWT_KEY = 'fake_jwt_token';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem(FAKE_JWT_KEY);
      if (token) {
        const userData = JSON.parse(atob(token.split('.')[1]));
        if (userData && userData.id) {
          setUser({
            id: userData.id,
            name: userData.name,
            profilePicture: userData.profilePicture,
            isOnline: true,
          });
        }
      }
    } catch (error) {
      console.error('Failed to parse auth token', error);
      localStorage.removeItem(FAKE_JWT_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((username: string): boolean => {
    const normalizedUsername = username.trim();
    if (normalizedUsername) {
      const userId = `user-${Date.now()}`;
      const newUser: User = {
        id: userId,
        name: normalizedUsername,
        isOnline: true,
      };
      const fakeToken = `header.${btoa(JSON.stringify(newUser))}.signature`;
      localStorage.setItem(FAKE_JWT_KEY, fakeToken);
      setUser(newUser);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(FAKE_JWT_KEY);
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
