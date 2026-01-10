import 'dotenv/config';
import { pool } from './db.js';

async function test() {
  const r = await pool.query('SELECT NOW()');
  console.log('DB Connected:', r.rows[0]);
  process.exit(0);
}

test().catch((e) => {
  console.error('DB Connection Failed:', e);
  process.exit(1);
});
