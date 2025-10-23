const pool = require('../db');

class Room {
  static async create(roomData) {
    const { id, name, type, privacy, password, createdBy } = roomData;
    const [result] = await pool.execute(
      'INSERT INTO rooms (id, name, type, privacy, password, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, type, privacy, password, createdBy]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM rooms WHERE id = ?', [id]);
    return rows[0];
  }

  static async getAll() {
    const [rows] = await pool.execute('SELECT * FROM rooms');
    return rows;
  }

  static async getRoomsForUser(userId) {
    const [rows] = await pool.execute(`
      SELECT r.* FROM rooms r
      JOIN room_users ru ON r.id = ru.room_id
      WHERE ru.user_id = ?
    `, [userId]);
    return rows;
  }

  static async addUser(roomId, userId) {
    const [result] = await pool.execute(
      'INSERT INTO room_users (room_id, user_id) VALUES (?, ?)',
      [roomId, userId]
    );
    return result.insertId;
  }

  static async removeUser(roomId, userId) {
    const [result] = await pool.execute(
      'DELETE FROM room_users WHERE room_id = ? AND user_id = ?',
      [roomId, userId]
    );
    return result.affectedRows > 0;
  }

  static async getUsers(roomId) {
    const [rows] = await pool.execute(`
      SELECT u.* FROM users u
      JOIN room_users ru ON u.id = ru.user_id
      WHERE ru.room_id = ?
    `, [roomId]);
    return rows;
  }

  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM rooms WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Room;
