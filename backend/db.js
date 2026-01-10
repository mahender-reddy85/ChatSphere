import pg from 'pg';
const { Pool } = pg;

// Create a new pool using the connection string from environment variables
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon's SSL
  }
});

// Test the database connection
export async function testConnection() {
  try {
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
