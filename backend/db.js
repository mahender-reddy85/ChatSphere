import 'dotenv/config';
import pg from 'pg';

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
