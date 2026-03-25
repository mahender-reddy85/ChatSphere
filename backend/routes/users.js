import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../db.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Define validation schemas
const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain alphanumeric characters and underscores"),
  password: z.string().min(6).max(100),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// Register a new user
router.post('/register', async (req, res) => {
  try {
    // 1. Schema Validation via Zod
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: validation.error.flatten().fieldErrors 
      });
    }

    const { username, password } = validation.data;

    // 2. Check if user exists
    const userExists = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create user
    const result = await pool.query(
      'INSERT INTO users (username, name, password_hash) VALUES ($1, $1, $2) RETURNING id, username',
      [username, hashedPassword]
    );

    const user = result.rows[0];

    // 5. Generate JWT (Short-lived for security, e.g., 24h)
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    res.status(500).json({
      success: false,
      message: 'Registration failed due to server error',
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    // 1. Schema Validation
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const { username, password } = validation.data;

    const result = await pool.query(
      'SELECT id, username, password_hash FROM users WHERE username = $1',
      [username]
    );

    const user = result.rows[0];
    if (!user) {
      // Security: use generic error message
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    return res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Get current user (protected route)
router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, created_at FROM users WHERE id = $1', [
      req.user.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Error getting user:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
