// Simple in-memory data store for development without DB
const users = [
  // Sample demo user
  { id: 'user-1', name: 'Demo User', email: 'demo@example.com' },
];

const rooms = [
  // Sample public room
  {
    id: 'general',
    name: 'General',
    type: 'group',
    privacy: 'public',
    password: null,
    createdBy: 'user-1',
  },
];

const messages = [];

export { users, rooms, messages };
