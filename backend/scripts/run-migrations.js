import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Read and execute each migration file
    const migrationFiles = [
      '../migrations/001_create_users_table.sql'
    ];
    
    for (const migrationFile of migrationFiles) {
      const filePath = path.join(__dirname, migrationFile);
      const sql = await readFile(filePath, 'utf8');
      console.log(`Running migration: ${migrationFile}`);
      await client.query(sql);
    }
    
    await client.query('COMMIT');
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(console.error);
