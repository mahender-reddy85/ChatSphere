import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM rooms');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a room
router.post('/', async (req, res) => {
  const { name, type = 'group', privacy = 'public', createdBy } = req.body;
  try {
    const result = await query(
      'INSERT INTO rooms (name, type, privacy, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, type, privacy, createdBy]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating room:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get room details
router.get('/:roomId', async (req, res) => {
  const { roomId } = req.params;
  try {
    const roomResult = await query('SELECT * FROM rooms WHERE id = $1', [roomId]);
    if (roomResult.rows.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    const membersResult = await query(
      'SELECT u.* FROM users u JOIN room_members rm ON u.id = rm.user_id WHERE rm.room_id = $1',
      [roomId]
    );
    
    res.json({
      ...roomResult.rows[0],
      members: membersResult.rows
    });
  } catch (err) {
    console.error('Error fetching room details:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join a room
router.post('/:roomId/join', async (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.body;
  
  try {
    // Check if user is already a member
    const existingMember = await query(
      'SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );
    
    if (existingMember.rows.length > 0) {
      return res.status(400).json({ message: 'User already in room' });
    }
    
    // Add user to room
    await query(
      'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)',
      [roomId, userId]
    );
    
    // Get room details to emit to all connected clients
    const roomResult = await query('SELECT * FROM rooms WHERE id = $1', [roomId]);
    const membersResult = await query(
      'SELECT u.* FROM users u JOIN room_members rm ON u.id = rm.user_id WHERE rm.room_id = $1',
      [roomId]
    );
    
    // Notify all clients about the updated room
    const io = req.app.get('io');
    io.to(roomId).emit('roomUpdated', {
      ...roomResult.rows[0],
      members: membersResult.rows
    });
    
    res.json({ message: 'Joined room successfully' });
  } catch (err) {
    console.error('Error joining room:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
