import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables from root .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Test connection function
export async function testConnection() {
  try {
    const r = await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected:', r.rows[0]);
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error connecting to PostgreSQL:', error);
    return false;
  }
}

// Export query function for convenience
export const query = (text, params) => pool.query(text, params);

export default {
  pool,
  query,
  testConnection
};
