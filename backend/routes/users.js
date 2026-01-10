import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { users } from '../dataStore.js';

const router = express.Router();

// Signup
export const signupUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields required' });
    }

    const existing = users.find((u) => u.email === email);
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const id = Date.now().toString();
    users.push({ id, name: username, email, password: hashed });

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Signup Error Details (in-memory):', error);
    res.status(500).json({ message: 'Server error' });
  }
};

router.post('/signup', signupUser);

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = users.find((u) => u.email === email);
    if (!user) return res.status(400).json({ message: 'User not found' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid password' });

    const token = jwt.sign({ id: user.id, name: user.name }, 'secretkey', { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login Error (in-memory):', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
