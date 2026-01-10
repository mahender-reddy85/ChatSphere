import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Get messages for a room
router.get('/:roomId', async (req, res) => {
  const { roomId } = req.params;
  try {
    const result = await query(
      `SELECT m.*, u.name as author_name, u.profile_picture as author_avatar
       FROM messages m
       LEFT JOIN users u ON m.author_id = u.id
       WHERE m.room_id = $1
       ORDER BY m.created_at ASC`,
      [roomId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/', async (req, res) => {
  const { roomId, authorId, text, type = 'text' } = req.body;
  
  try {
    // Insert the message into the database
    const result = await query(
      `INSERT INTO messages (room_id, author_id, text, type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [roomId, authorId, text, type]
    );
    
    // Get the full message with author details
    const messageResult = await query(
      `SELECT m.*, u.name as author_name, u.profile_picture as author_avatar
       FROM messages m
       LEFT JOIN users u ON m.author_id = u.id
       WHERE m.id = $1`,
      [result.rows[0].id]
    );
    
    const message = messageResult.rows[0];
    
    // Emit the new message to all clients in the room
    const io = req.app.get('io');
    io.to(roomId).emit('receiveMessage', message);
    
    res.status(201).json(message);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get message history with pagination
router.get('/:roomId/history', async (req, res) => {
  const { roomId } = req.params;
  const { before = Date.now(), limit = 50 } = req.query;
  
  try {
    const result = await query(
      `SELECT m.*, u.name as author_name, u.profile_picture as author_avatar
       FROM messages m
       LEFT JOIN users u ON m.author_id = u.id
       WHERE m.room_id = $1 AND m.created_at < to_timestamp($2/1000.0)
       ORDER BY m.created_at DESC
       LIMIT $3`,
      [roomId, before, limit]
    );
    
    // Return messages in chronological order (oldest first)
    res.json(result.rows.reverse());
  } catch (err) {
    console.error('Error fetching message history:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
