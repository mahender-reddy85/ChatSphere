import express from 'express';
import { nanoid } from 'nanoid';
import { pool, query } from '../db.js';
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
router.post('/', auth, async (req, res, next) => {
  try {
    const { name, type = 'group', visibility = 'public' } = req.body;

    const code = nanoid(6);

    // Using pool.query directly to match user requirement
    const result = await pool.query(
      `INSERT INTO rooms 
       (name, code, type, visibility, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, code, type, visibility, req.user.id]
    );

    const newRoom = result.rows[0];

    // Autojoin creator (Essential for ChatWindow to load)
    if (newRoom && req.user.id) {
      await pool.query(
        'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [newRoom.id, req.user.id]
      );
    }

    res.status(201).json(newRoom);
  } catch (err) {
    console.error("Error creating room:", err);
    next(err);
  }
});

// Get room details (Supports both ID and slug/name)
router.get('/:roomIdOrName', async (req, res) => {
  const { roomIdOrName } = req.params;
  try {
    let room;
    if (/^\d+$/.test(roomIdOrName)) {
      const resp = await query('SELECT * FROM rooms WHERE id = $1', [roomIdOrName]);
      room = resp.rows[0];
    }
    if (!room) {
      const resp = await query('SELECT * FROM rooms WHERE name = $1', [roomIdOrName]);
      room = resp.rows[0];
    }
    if (!room) {
      const resp = await query('SELECT * FROM rooms WHERE code = $1', [roomIdOrName]);
      room = resp.rows[0];
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

// Join a room (Supports ID and slug/name)
router.post('/:roomIdOrName/join', auth, async (req, res) => {
  const { roomIdOrName } = req.params;
  const userId = req.user.id;

  try {
    let room;
    if (/^\d+$/.test(roomIdOrName)) {
      const resp = await query('SELECT id FROM rooms WHERE id = $1', [roomIdOrName]);
      room = resp.rows[0];
    }
    if (!room) {
      const resp = await query('SELECT id FROM rooms WHERE name = $1', [roomIdOrName]);
      room = resp.rows[0];
    }
    if (!room) {
      const resp = await query('SELECT id FROM rooms WHERE code = $1', [roomIdOrName]);
      room = resp.rows[0];
    }

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const roomId = room.id;

    await query('INSERT INTO room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
      roomId,
      userId,
    ]);

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

    res.json({ message: 'Joined successfully', room: roomData });
  } catch (err) {
    console.error('Error joining room:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
