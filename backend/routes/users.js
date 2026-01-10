import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "username and password required" });
    }

    // Check if user exists
    const userExists = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Username already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await pool.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username",
      [username, hashedPassword]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "username and password required" });
    }

    const result = await pool.query(
      "SELECT id, username, password_hash FROM users WHERE username = $1",
      [username]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Update last_seen if the column exists
    try {
      await pool.query("UPDATE users SET last_seen = NOW() WHERE id = $1", [user.id]);
    } catch (err) {
      console.log("Note: last_seen column not updated - it might not exist in the database yet");
    }

    return res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ success: false, message: "Login failed" });
  }
});

// Get current user (protected route)
router.get("/me", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const user = result.rows[0];
    
    // Try to get last_seen if the column exists
    try {
      const lastSeenResult = await pool.query(
        "SELECT last_seen FROM users WHERE id = $1",
        [req.user.id]
      );
      if (lastSeenResult.rows[0]?.last_seen) {
        user.last_seen = lastSeenResult.rows[0].last_seen;
      }
    } catch (err) {
      console.log("Note: last_seen column not found");
    }
    
    res.json({ success: true, user });
  } catch (err) {
    console.error("Error getting user:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;