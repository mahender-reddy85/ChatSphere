import 'dotenv/config';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Robust Migration Runner
 * Features: Version Locking, History Tracking, Idempotency
 */
export async function runMigrations(rollback = false) {
  const client = await pool.connect();

  try {
    // 1. Initialize Migration History Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations_history (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        success BOOLEAN NOT NULL
      );
    `);

    // 2. Define Migration Manifest (Order matters!)
    const migrationFiles = [
      '001_create_users_table.sql',
      '002_create_rooms_table.sql',
      '003_upgrade_to_bigint.sql',
      '004_add_last_seen.sql',
      '005_repair_rooms_schema.sql',
      '006_repair_users.sql',
    ];

    if (rollback) {
       console.log('\n🔄 ROLLBACK mode enabled (Warning: Not all migrations have automated down scripts)');
       // For this simple set, we'll just log that manual intervention is needed or implement simple drops.
       // In a full system, you would have 001_down.sql etc.
       console.log('Rolling back the last applied migration...');
       const lastRes = await client.query('SELECT filename FROM _migrations_history WHERE success = true ORDER BY id DESC LIMIT 1');
       if (lastRes.rows.length === 0) {
         console.log('No migrations found to roll back.');
         return;
       }
       const toRollback = lastRes.rows[0].filename;
       console.log(`Manual rollback needed for: ${toRollback}`);
       // Removing from history to allow re-run
       await client.query('DELETE FROM _migrations_history WHERE filename = $1', [toRollback]);
       return;
    }

    // 3. Filter already applied migrations
    const appliedRes = await client.query('SELECT filename FROM _migrations_history WHERE success = true');
    const appliedSet = new Set(appliedRes.rows.map(r => r.filename));

    const pendingFiles = migrationFiles.filter(f => !appliedSet.has(f));

    if (pendingFiles.length === 0) {
      console.log('✅ No new migrations to apply. (Version locked)');
      return { success: true, count: 0 };
    }

    console.log(`\n📦 Found ${pendingFiles.length} pending migrations.`);

    for (const filename of pendingFiles) {
      const filePath = path.join(__dirname, '../migrations', filename);
      const sql = await readFile(filePath, 'utf8');

      console.log(`🔧 Running: ${filename}...`);

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO _migrations_history (filename, success) VALUES ($1, $2)', [filename, true]);
        await client.query('COMMIT');
        console.log(`✅ Success`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Migration FAILED: ${filename}`);
        console.error(error.message);
        throw error;
      }
    }

    console.log('\n🎉 Database is now fully synchronized!');
    return { success: true, count: pendingFiles.length };
  } catch (error) {
    console.error('\n🚨 Critical Error in Migration Runner:');
    console.error(error);
    throw error;
  } finally {
    client.release();
  }
}

// CLI Integration
if (process.argv[1] && process.argv[1].endsWith('run-migrations.js')) {
  const isRollback = process.argv.includes('--rollback');
  runMigrations(isRollback)
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await pool.end();
      process.exit(1);
    });
}
