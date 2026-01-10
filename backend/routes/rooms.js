import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM rooms');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a room
router.post('/', async (req, res) => {
  const { name, type, privacy, password, createdBy } = req.body;
  try {
    const id = `room-${Date.now()}`;
    await pool.query(
      'INSERT INTO rooms (id, name, type, privacy, password, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, type, privacy, password, createdBy]
    );
    res.status(201).json({ id, name, type, privacy, createdBy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join a room
router.post('/:roomId/join', async (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.body;
  try {
    await pool.query('INSERT INTO room_users (room_id, user_id) VALUES (?, ?)', [roomId, userId]);
    res.json({ message: 'Joined room successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
