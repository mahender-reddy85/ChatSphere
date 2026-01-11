import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const { Pool } = pg;

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function createUsersTable() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create users table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_seen TIMESTAMP WITH TIME ZONE,
        is_online BOOLEAN DEFAULT false
      )
    `);
    
    console.log('✅ Checking if users table exists...');
    
    // Check if the table was created
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    console.log('✅ Users table exists:', result.rows[0].exists);
    
    await client.query('COMMIT');
    console.log('✅ Database schema is up to date');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
try {
  await createUsersTable();
  console.log('✅ Migration completed successfully');
  await pool.end();
  process.exit(0);
} catch (err) {
  console.error('❌ Migration failed:', err);
  await pool.end();
  process.exit(1);
}
