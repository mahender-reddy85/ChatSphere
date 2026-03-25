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

// Test connection and verify schema integrity
export async function testConnection() {
  const client = await pool.connect();
  try {
    const r = await client.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected');

    // Schema Verification Step
    const health = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('users', 'rooms') 
      AND column_name = 'id'
    `);
    
    if (health.rows.length === 0) {
      console.warn('⚠️ Tables not found yet - awaiting migration');
      return true;
    }

    const checks = health.rows.every(c => c.data_type === 'bigint');
    if (!checks) {
      console.error('❌ SCHEMA MISMATCH: Expected BIGINT for ID columns but found something else.');
      console.error('Check results:', health.rows);
      throw new Error("Schema alignment failed: IDs must be BIGINT");
    }

    console.log('🛡️ Schema verification complete (64-bit ID compliance confirmed)');
    return true;
  } catch (error) {
    console.error('❌ Database Initialization Error:', error.message);
    return false;
  } finally {
    client.release();
  }
}

// Export query function for convenience
export const query = (text, params) => pool.query(text, params);

export default {
  pool,
  query,
  testConnection,
};
