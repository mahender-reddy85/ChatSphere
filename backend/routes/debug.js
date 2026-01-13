import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { runMigrations } from '../scripts/run-migrations.js';

const router = express.Router();
const sentinelPath = path.join(process.cwd(), 'backend', '.migrations_ran');

// POST /api/debug/run-migrations
// Requires header: x-migration-token: <MIGRATION_TOKEN>
router.post('/run-migrations', async (req, res) => {
  const token = req.header('x-migration-token');
  const secret = process.env.MIGRATION_TOKEN;

  if (!secret) {
    console.warn('MIGRATION_TOKEN is not set on the server. Blocking migration endpoint.');
    return res.status(403).json({ message: 'Migration endpoint not enabled on this server' });
  }

  if (!token || token !== secret) {
    console.warn('Unauthorized migration attempt');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Check sentinel
    try {
      await fs.access(sentinelPath);
      console.log('Migration sentinel found - migrations already run; skipping');
      return res.status(200).json({ message: 'Migrations already applied (sentinel present)' });
    } catch (e) {
      // sentinel not found - proceed
    }

    console.log('Authorized migration request received - running migrations now');
    await runMigrations();

    // Create sentinel file so this endpoint is one-shot
    await fs.writeFile(sentinelPath, `ran-at:${new Date().toISOString()}\n`, 'utf8');

    console.log('Migrations applied and sentinel written');
    return res.status(200).json({ message: 'Migrations applied successfully' });
  } catch (err) {
    console.error('Error running migrations via endpoint:', err && (err.stack || err));
    return res.status(500).json({ message: 'Migration failed', detail: err.message });
  }
});

export default router;
