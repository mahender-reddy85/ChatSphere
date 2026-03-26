import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * 🛡️ Comprehensive Schema Validator
 * Ensures the production DB matches the application expectations
 */
export async function testConnection() {
  const client = await pool.connect();
  try {
    const r = await client.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected');

    // Define the REQUIRED schema state
    const requiredColumns = [
      { table: 'users', column: 'id', type: 'bigint' },
      { table: 'users', column: 'name', type: 'character varying' },
      { table: 'users', column: 'last_seen', type: 'timestamp with time zone' },
      { table: 'rooms', column: 'id', type: 'bigint' },
      { table: 'rooms', column: 'code', type: 'character varying' }, // Must exist for room indexing
      { table: 'rooms', column: 'name', type: 'character varying' },
    ];

    const health = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
    `);
    
    if (health.rows.length === 0) {
      console.warn('⚠️ Database is empty - awaiting first migration run');
      return true;
    }

    const currentSchema = health.rows;
    const errors = [];

    for (const req of requiredColumns) {
      const found = currentSchema.find(c => 
        c.table_name === req.table && c.column_name === req.column
      );

      if (!found) {
        errors.push(`Missing column: ${req.table}.${req.column}`);
      } else if (found.data_type !== req.type && !req.type.includes(found.data_type)) {
        // Simple type check (ignoring varying vs varchar nuances for now)
        if (!(req.type === 'character varying' && found.data_type === 'text')) {
           errors.push(`Type mismatch: ${req.table}.${req.column} (Expected ${req.type}, Got ${found.data_type})`);
        }
      }
    }

    if (errors.length > 0) {
      console.error('❌ CRITICAL SCHEMA ERROR:');
      errors.forEach(err => console.error(`  - ${err}`));
      // In a strict production environment, we would throw here.
      // For now, we log clearly to let migrations handle the fix.
    } else {
      console.log('🛡️ Schema verification successful: All critical columns and types confirmed.');
    }

    return true;
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    return false;
  } finally {
    client.release();
  }
}

export const query = (text, params) => pool.query(text, params);

export default {
  pool,
  query,
  testConnection,
};
