import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

async function initDatabase() {
  let connection;

  try {
    // Create connection without specifying database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    // Create database if it doesn't exist
    await connection.execute('CREATE DATABASE IF NOT EXISTS chatsphere');
    console.log('Database created or already exists');

    // Use the database
    await connection.changeUser({ database: 'chatsphere' });

    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        profile_picture TEXT,
        is_online BOOLEAN DEFAULT FALSE,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table created');

    // Create rooms table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS rooms (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type ENUM('self', 'ai', 'group') NOT NULL,
        privacy ENUM('public', 'private') NOT NULL,
        password VARCHAR(255),
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    console.log('Rooms table created');

    // Create room_users table for many-to-many relationship
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS room_users (
        room_id VARCHAR(255),
        user_id VARCHAR(255),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (room_id, user_id),
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Room_users table created');

    // Create messages table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(255) PRIMARY KEY,
        room_id VARCHAR(255) NOT NULL,
        author_id VARCHAR(255),
        text TEXT,
        type ENUM('text', 'system') DEFAULT 'text',
        timestamp BIGINT NOT NULL,
        is_edited BOOLEAN DEFAULT FALSE,
        is_pinned BOOLEAN DEFAULT FALSE,
        is_deleted BOOLEAN DEFAULT FALSE,
        deleted_by VARCHAR(255),
        reply_to VARCHAR(255),
        status ENUM('sent', 'delivered', 'seen') DEFAULT 'sent',
        file_url TEXT,
        file_name VARCHAR(255),
        file_type VARCHAR(255),
        audio_url TEXT,
        audio_duration INT,
        location_lat DECIMAL(10, 8),
        location_lng DECIMAL(11, 8),
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (author_id) REFERENCES users(id),
        FOREIGN KEY (deleted_by) REFERENCES users(id),
        FOREIGN KEY (reply_to) REFERENCES messages(id)
      )
    `);
    console.log('Messages table created');

    // Create reactions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS reactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        emoji VARCHAR(10) NOT NULL,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_reaction (message_id, user_id, emoji)
      )
    `);
    console.log('Reactions table created');

    // Create polls table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS polls (
        id VARCHAR(255) PRIMARY KEY,
        message_id VARCHAR(255) NOT NULL,
        question TEXT NOT NULL,
        location TEXT,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `);
    console.log('Polls table created');

    // Create poll_options table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS poll_options (
        id VARCHAR(255) PRIMARY KEY,
        poll_id VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
      )
    `);
    console.log('Poll_options table created');

    // Create poll_votes table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS poll_votes (
        poll_option_id VARCHAR(255),
        user_id VARCHAR(255),
        PRIMARY KEY (poll_option_id, user_id),
        FOREIGN KEY (poll_option_id) REFERENCES poll_options(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Poll_votes table created');

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    process.exit();
  }
}

initDatabase();
