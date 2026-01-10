import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    // Check if user already exists
    const userExists = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const result = await query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, profile_picture',
      [name, email, hashedPassword]
    );
    
    // Generate JWT
    const token = jwt.sign(
      { id: result.rows[0].id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '30d' }
    );
    
    res.status(201).json({
      ...result.rows[0],
      token
    });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Check if user exists
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '30d' }
    );
    
    // Update last login
    await query('UPDATE users SET last_seen = NOW() WHERE id = $1', [user.id]);
    
    // Return user data (excluding password)
    const { password: _, ...userData } = user;
    
    res.json({
      ...userData,
      token
    });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Get user from database
    const result = await query(
      'SELECT id, name, email, profile_picture, is_online, last_seen FROM users WHERE id = $1',
      [decoded.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error getting user:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  const { name, profilePicture } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Update user profile
    const result = await query(
      'UPDATE users SET name = COALESCE($1, name), profile_picture = COALESCE($2, profile_picture), updated_at = NOW() WHERE id = $3 RETURNING id, name, email, profile_picture',
      [name, profilePicture, decoded.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
