import express from 'express';
import { query } from '../db.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM rooms ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a room
router.post('/', auth, async (req, res) => {
  const { name, type = 'group', privacy = 'public' } = req.body;

  if (!name || String(name).trim() === '') {
    return res.status(400).json({ message: 'Invalid room name' });
  }

  try {
    const createdByInt =
      req.user && Number.isInteger(Number(req.user.id)) ? Number(req.user.id) : null;

    console.log(`Creating room: "${name}", type: ${type}, by: ${createdByInt || 'anonymous'}`);

    // Standardize: 'name' from the frontend is used as the UNIQUE room SLUG
    const result = await query(
      'INSERT INTO rooms (name, type, privacy, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, type, privacy, createdByInt]
    );

    const newRoom = result.rows[0];

    // Auto-join the creator
    if (createdByInt && newRoom) {
      await query('INSERT INTO room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
        newRoom.id,
        createdByInt,
      ]);
    }

    res.status(201).json(newRoom);
  } catch (err) {
    console.error('Error creating room:', err);
    res.status(500).json({
      message: 'Failed to create room',
      error: err.message
    });
  }
});

// Get room details (Supports both Numeric ID and Name/Slug)
router.get('/:roomIdOrName', async (req, res) => {
  const { roomIdOrName } = req.params;
  try {
    let room;
    // Check if it's a numeric ID
    if (/^\d+$/.test(roomIdOrName)) {
      const res = await query('SELECT * FROM rooms WHERE id = $1', [roomIdOrName]);
      room = res.rows[0];
    } 
    
    // Fallback search by name (slug) if not found by ID
    if (!room) {
      const res = await query('SELECT * FROM rooms WHERE name = $1', [roomIdOrName]);
      room = res.rows[0];
    }

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const membersResult = await query(
      `SELECT u.id, u.username, u.name, u.profile_picture, u.is_online
       FROM users u
       JOIN room_members rm ON u.id = rm.user_id
       WHERE rm.room_id = $1`,
      [room.id]
    );

    res.json({
      ...room,
      members: membersResult.rows,
    });
  } catch (err) {
    console.error('Error fetching room details:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join a room (Supports both Numeric ID and Name/Slug)
router.post('/:roomIdOrName/join', auth, async (req, res) => {
  const { roomIdOrName } = req.params;
  const userId = req.user.id;

  try {
    // Resolve room numeric ID
    let room;
    if (/^\d+$/.test(roomIdOrName)) {
      const res = await query('SELECT id FROM rooms WHERE id = $1', [roomIdOrName]);
      room = res.rows[0];
    }
    if (!room) {
      const res = await query('SELECT id FROM rooms WHERE name = $1', [roomIdOrName]);
      room = res.rows[0];
    }

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const roomId = room.id;

    const existingMember = await query(
      'SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2',
      [roomId, userId]
    );

    if (existingMember.rows.length > 0) {
      return res.status(200).json({ message: 'Already a member' });
    }

    await query('INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)', [roomId, userId]);

    // Cleanup: Fetch updated state
    const roomResult = await query('SELECT * FROM rooms WHERE id = $1', [roomId]);
    const membersResult = await query(
      `SELECT u.id, u.username, u.name, u.profile_picture, u.is_online
       FROM users u
       JOIN room_members rm ON u.id = rm.user_id
       WHERE rm.room_id = $1`,
      [roomId]
    );

    const roomData = {
      ...roomResult.rows[0],
      members: membersResult.rows,
    };

    const io = req.app.get('io');
    if (io) {
      io.to(roomId.toString()).emit('room_updated', roomData);
    }

    res.json({ message: 'Joined room successfully', room: roomData });
  } catch (err) {
    console.error('Error joining room:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
