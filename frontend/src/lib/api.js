import { getToken } from './auth';

// Base URL from environment variables
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

if (!BASE_URL) {
  console.error('VITE_BACKEND_URL is not set in environment variables');
}

// API utility function
export async function api(path, options = {}) {
  const token = getToken();
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'API Error');
  }

  return data;
}

// Auth API functions
export const authApi = {
  register: async (userData) => {
    return api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials) => {
    return api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  getMe: async () => {
    return api('/api/auth/me');
  },
};

// Initialize socket.io with JWT token
export const initSocket = () => {
  const token = getToken();
  return window.io(import.meta.env.VITE_BACKEND_URL, {
    auth: { token },
    transports: ['websocket'],
  });
};
