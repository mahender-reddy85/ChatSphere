import { pool } from '../db.js';

async function inspect() {
  const client = await pool.connect();
  try {
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    console.log('Tables:', tables.rows.map(r => r.table_name));

    const cols = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'messages'
    `);
    console.log('Messages columns:', cols.rows);

    const roomsCols = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'rooms'
    `);
    console.log('Rooms columns:', roomsCols.rows);
  } catch (err) {
    console.error('DB inspect error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

inspect().catch(console.error);
