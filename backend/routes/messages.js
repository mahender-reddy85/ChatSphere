import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Get messages for a room
router.get('/:roomId', async (req, res) => {
  const { roomId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM messages WHERE room_id = ? ORDER BY timestamp ASC',
      [roomId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/', async (req, res) => {
  const { roomId, authorId, text, type = 'text' } = req.body;
  try {
    const timestamp = Date.now();
    const id = `msg-${timestamp}`;
    await pool.query(
      'INSERT INTO messages (id, room_id, author_id, text, type, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
      [id, roomId, authorId, text, type, timestamp]
    );
    res.status(201).json({ id, roomId, authorId, text, type, timestamp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
