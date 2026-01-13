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

// Debug: return rooms table columns (temporary endpoint to inspect production schema)
router.get('/debug/rooms-schema', async (req, res) => {
  try {
    const colsRes = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'rooms'");
    const columns = colsRes.rows.map((r) => r.column_name);
    console.log('GET /api/debug/rooms-schema ->', columns);
    res.json({ columns });
  } catch (err) {
    console.error('Error fetching rooms schema (debug endpoint):', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a room (defensive: auto-create table if missing and retry once)
router.post('/', async (req, res) => {
  const { name, type = 'group', privacy = 'public', createdBy } = req.body;

  // Log the incoming request for debugging
  console.log('POST /api/rooms request body:', req.body, 'from', req.ip, 'headers', {
    origin: req.headers.origin,
    referer: req.headers.referer,
  });

  // Basic validation
  if (!name || String(name).trim() === '') {
    console.warn('Invalid room create request - missing name');
    return res.status(400).json({ message: 'Invalid room name' });
  }

  try {
    // Determine createdByInt securely.
    // Prefer authenticated user (req.user.id). If no authenticated user, ignore any client-supplied createdBy to avoid spoofing.
    let createdByInt = null;

    if (req.user && Number.isInteger(req.user.id)) {
      createdByInt = req.user.id;
    } else {
      // Do not trust client-provided createdBy when unauthenticated
      if (createdBy !== undefined && createdBy !== null) {
        console.warn('Unauthenticated request attempted to set createdBy; ignoring client-supplied value:', createdBy);
      }
      createdByInt = null;
    }

    // Ensure createdByInt is a safe 32-bit integer; otherwise nullify
    if (createdByInt !== null) {
      const num = Number(createdByInt);
      if (!Number.isInteger(num) || num > 2147483647 || num < 0) {
        console.warn('createdBy out of safe range or invalid; nullifying', createdByInt);
        createdByInt = null;
      } else {
        createdByInt = num;
      }
    }

    console.log('createRoom: using createdByInt:', createdByInt, 'authenticatedUser:', req.user && req.user.id);

    // Detect schema: prefer (name, type, privacy, created_by) if present, otherwise fall back to legacy (code)
    // Debug: database info and ordered rooms columns (helps diagnose production schema differences)
    const dbInfo = await query(`SELECT current_database() as db, current_schema() as schema`);
    console.log('DB INFO:', dbInfo.rows[0]);

    const colsRes = await query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='rooms'
      ORDER BY ordinal_position
    `);
    console.log('ROOM COLS:', colsRes.rows.map((r) => r.column_name));
    const cols = new Set(colsRes.rows.map((r) => r.column_name));
    console.log('Detected rooms columns:', Array.from(cols));

    if (cols.has('name')) {
      console.log('Rooms schema detected: modern (name)');
      const result = await query(
        'INSERT INTO rooms (name, type, privacy, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, type, privacy, createdByInt]
      );
      return res.status(201).json(result.rows[0]);
    }

    if (cols.has('code')) {
      console.log('Rooms schema detected: legacy (code)');
      // Legacy schema: store our generated slug in `code` column
      const result = await query(
        'INSERT INTO rooms (code, created_at) VALUES ($1, CURRENT_TIMESTAMP) RETURNING *',
        [name]
      );
      return res.status(201).json(result.rows[0]);
    }

    // Fallback: try default insert and let it error if it fails
    console.log('Rooms schema unknown - attempting default insert');
    const result = await query(
      'INSERT INTO rooms (name, type, privacy, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, type, privacy, createdByInt]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating room (first attempt):', err && (err.stack || err));

    // If the rooms table doesn't exist, create the modern table and retry once
    const isUndefinedTable = err && (err.code === '42P01' || /relation\s+"rooms"\s+does\s+not\s+exist/i.test(err.message));
    if (isUndefinedTable) {
      try {
        console.log('Rooms table missing. Creating rooms table...');
        await query(`
          CREATE TABLE IF NOT EXISTS rooms (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL DEFAULT 'group',
            privacy VARCHAR(50) NOT NULL DEFAULT 'public',
            password TEXT,
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // retry insert
        const retry = await query(
          'INSERT INTO rooms (name, type, privacy, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
          [name, type, privacy, createdByInt]
        );
        return res.status(201).json(retry.rows[0]);
      } catch (retryErr) {
        console.error('Error creating rooms table or retrying insert:', retryErr && (retryErr.stack || retryErr));
        return res.status(500).json({ message: 'Server error', detail: process.env.NODE_ENV === 'development' ? retryErr.message : undefined });
      }
    }

    // Handle missing-column errors (e.g., "column \"name\" of relation \"rooms\" does not exist")
    const isMissingColumn = err && (err.code === '42703' || /column\s+"[^"]+"\s+of\s+relation\s+"rooms"\s+does\s+not\s+exist/i.test(err.message));
    if (isMissingColumn) {
      console.warn('Detected missing column error when creating room. Attempting legacy/repair strategies...');
      try {
        const colsRes = await query(
          "SELECT column_name FROM information_schema.columns WHERE table_name = 'rooms'"
        );
        const cols = new Set(colsRes.rows.map((r) => r.column_name));

        if (cols.has('code')) {
          console.log('Legacy "code" column found on rooms - inserting into code');
          const legacy = await query(
            'INSERT INTO rooms (code, created_at) VALUES ($1, CURRENT_TIMESTAMP) RETURNING *',
            [name]
          );
          return res.status(201).json(legacy.rows[0]);
        }

        // If no legacy code column, try to add a nullable 'name' column and retry
        if (!cols.has('name')) {
          console.log('Adding nullable "name" column to rooms table to support modern schema');
          await query("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS name VARCHAR(255)");
        }

        const alterRetry = await query(
          'INSERT INTO rooms (name, type, privacy, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
          [name, type, privacy, createdByInt]
        );
        return res.status(201).json(alterRetry.rows[0]);
      } catch (fixErr) {
        console.error('Error handling missing-column case:', fixErr && (fixErr.stack || fixErr));
        return res.status(500).json({ message: 'Server error', detail: process.env.NODE_ENV === 'development' ? fixErr.message : undefined });
      }
    }

    return res.status(500).json({ message: 'Server error', detail: process.env.NODE_ENV === 'development' ? err.message : undefined });
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
      members: membersResult.rows,
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
    await query('INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)', [roomId, userId]);

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
      members: membersResult.rows,
    });

    res.json({ message: 'Joined room successfully' });
  } catch (err) {
    console.error('Error joining room:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
