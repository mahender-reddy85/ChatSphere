import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Create a new pool for migrations
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon's SSL
  }
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔄 Starting database migrations...');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        profile_picture TEXT,
        is_online BOOLEAN DEFAULT false,
        last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create rooms table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        privacy VARCHAR(50) NOT NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create room_members table
    await client.query(`
      CREATE TABLE IF NOT EXISTS room_members (
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (room_id, user_id)
      )
    `);
    
    // Create messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        text TEXT,
        type VARCHAR(50) DEFAULT 'text',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes
    console.log('🔨 Creating indexes...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_author_id ON messages(author_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id)');
    
    await client.query('COMMIT');
    console.log('✅ Database schema created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating database schema:', error);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

runMigrations();
