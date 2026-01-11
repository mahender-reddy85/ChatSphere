/** @typedef {import('./types').User} User */
/** @typedef {import('./types').UserData} UserData */
/** @typedef {import('./types').UserCredentials} UserCredentials */
/** @typedef {import('./types').ApiResponse} ApiResponse */
/** @typedef {import('./types').AuthResponse} AuthResponse */

import { getToken } from './auth';

// Base URL from environment variables
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

if (!import.meta.env.VITE_BACKEND_URL) {
  console.warn('VITE_BACKEND_URL is not set in environment variables, using default:', BASE_URL);
}

/**
 * Makes an API request with the given path and options
 * @param {string} path - The API endpoint path
 * @param {RequestInit} [options] - Fetch options
 * @returns {Promise<any>} The API response data
 * @throws {Error} If the API request fails
 */
export async function api(path, options = {}) {
  const token = getToken();
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });

  let data;
  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(data.message || 'API Error');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/** @type {import('./types').AuthApi} */
export const authApi = {
  /**
   * Register a new user
   * @param {UserData} userData - User registration data
   * @returns {Promise<AuthResponse>} The authentication response
   */
  register: async (userData) => {
    return api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Login a user
   * @param {UserCredentials} credentials - User credentials
   * @returns {Promise<AuthResponse>} The authentication response
   */
  login: async (credentials) => {
    return api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  /**
   * Get current user profile
   * @returns {Promise<AuthResponse>} The user profile
   */
  getMe: async () => {
    return api('/api/auth/me');
  },

  /**
   * Update user profile
   * @param {Partial<UserData>} userData - Updated user data
   * @returns {Promise<AuthResponse>} The updated user profile
   */
  updateProfile: async (userData) => {
    return api('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Change user password
   * @param {{ currentPassword: string, newPassword: string }} data - Password change data
   * @returns {Promise<{ message: string }>} Success message
   */
  changePassword: async (data) => {
    return api('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Initialize socket.io with JWT token
   * @returns {Promise<{ connected: boolean }>} Socket connection status
   */
  initSocket: async () => {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    // In a real implementation, you would initialize the socket connection here
    // This is a placeholder for the actual implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Socket connected with token:', token);
        resolve({ connected: true });
      }, 100);
    });
  },
};

// For backward compatibility
export const initSocket = authApi.initSocket;
