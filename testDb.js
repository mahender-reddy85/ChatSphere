import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME
      // No authPlugins needed; mysql2 now auto-detects caching_sha2_password
    });

    console.log('✅ Database connection successful!');
    const [tables] = await connection.query('SHOW TABLES;');
    console.log('Tables in database:', tables);
    await connection.end();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
}

testConnection();
