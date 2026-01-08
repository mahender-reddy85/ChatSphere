import React from 'react';
import type { User } from './types';
import { IconAI, IconChat, IconUsers } from './components/Icons';

export const MOCK_USERS: Record<string, User> = {
  'user-1': { id: 'user-1', name: 'Alex', isOnline: true },
  'user-2': { id: 'user-2', name: 'Sam', isOnline: true },
  'user-3': { id: 'user-3', name: 'Casey', isOnline: false },
  'user-4': { id: 'user-4', name: 'Jordan', isOnline: true },
  'ai-bot': { id: 'ai-bot', name: 'AI Assistant', isOnline: true }
};