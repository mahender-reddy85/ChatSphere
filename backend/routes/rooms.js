import express from 'express';
import { rooms } from '../dataStore.js';

const router = express.Router();

// Get all rooms
router.get('/', (req, res) => {
  try {
    res.json(rooms);
  } catch (err) {
    console.error('Error fetching rooms (in-memory):', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a room
router.post('/', (req, res) => {
  const { name, type = 'group', privacy = 'public', password, createdBy } = req.body;
  try {
    const id = `room-${Date.now()}`;
    const room = { id, name, type, privacy, password, createdBy };
    rooms.push(room);
    res.status(201).json({ id, name, type, privacy, createdBy });
  } catch (err) {
    console.error('Error creating room (in-memory):', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join a room
router.post('/:roomId/join', (req, res) => {
  const { roomId } = req.params;
  try {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    // In-memory membership handling is lightweight for now
    // (client keeps users in its own state)
    res.json({ message: 'Joined room successfully' });
  } catch (err) {
    console.error('Error joining room (in-memory):', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
