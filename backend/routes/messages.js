import express from 'express';
import { messages } from '../dataStore.js';

const router = express.Router();

// Get messages for a room
router.get('/:roomId', (req, res) => {
  const { roomId } = req.params;
  try {
    const roomMessages = messages
      .filter((m) => m.roomId === roomId)
      .sort((a, b) => a.timestamp - b.timestamp);
    res.json(roomMessages);
  } catch (err) {
    console.error('Error fetching messages (in-memory):', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/', (req, res) => {
  const { roomId, authorId, text, type = 'text' } = req.body;
  try {
    const timestamp = Date.now();
    const id = `msg-${timestamp}`;
    const message = { id, roomId, authorId, text, type, timestamp };
    messages.push(message);
    res.status(201).json(message);
  } catch (err) {
    console.error('Error sending message (in-memory):', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
