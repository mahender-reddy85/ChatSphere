import { getToken } from './auth';

const BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export async function api(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'API Error');
  }

  return data;
}
