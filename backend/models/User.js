const pool = require('../db');

class User {
  static async create(userData) {
    const { id, name, email, password, profilePicture } = userData;
    const [result] = await pool.execute(
      'INSERT INTO users (id, name, email, password, profile_picture) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, password, profilePicture]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  static async update(id, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field) => `${field} = ?`).join(', ');
    const [result] = await pool.execute(`UPDATE users SET ${setClause} WHERE id = ?`, [
      ...values,
      id,
    ]);
    return result.affectedRows > 0;
  }

  static async updateOnlineStatus(id, isOnline) {
    const [result] = await pool.execute(
      'UPDATE users SET is_online = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
      [isOnline, id]
    );
    return result.affectedRows > 0;
  }

  static async getAll() {
    const [rows] = await pool.execute('SELECT * FROM users');
    return rows;
  }
}

module.exports = User;
