import 'dotenv/config';
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
      console.log(`\n🔧 Running migration: ${migrationFile}`);
      console.log('Executing SQL:', sql);
      try {
        await client.query(sql);
        console.log('✅ Migration successful');
      } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error; // This will trigger the ROLLBACK
      }
    }
    
    await client.query('COMMIT');
    console.log('\n🎉 All migrations completed successfully!');
    console.log('Database is ready to use! 🚀');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed with error:');
    console.error(error);
    console.log('\n💡 Check if the database exists and your DATABASE_URL is correct in .env');
    console.log('Current DATABASE_URL:', process.env.DATABASE_URL ? '***' + process.env.DATABASE_URL.slice(-20) : 'Not set!');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(console.error);
