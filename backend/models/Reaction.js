const pool = require('../db');

class Reaction {
  static async add(messageId, userId, emoji) {
    const [result] = await pool.execute(
      'INSERT INTO reactions (message_id, user_id, emoji) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id=id',
      [messageId, userId, emoji]
    );
    return result.insertId;
  }

  static async remove(messageId, userId, emoji) {
    const [result] = await pool.execute(
      'DELETE FROM reactions WHERE message_id = ? AND user_id = ? AND emoji = ?',
      [messageId, userId, emoji]
    );
    return result.affectedRows > 0;
  }

  static async getByMessageId(messageId) {
    const [rows] = await pool.execute(
      `
      SELECT r.emoji, r.user_id, u.name as user_name
      FROM reactions r
      JOIN users u ON r.user_id = u.id
      WHERE r.message_id = ?
      ORDER BY r.emoji
    `,
      [messageId]
    );
    return rows;
  }

  static async getGroupedByMessageId(messageId) {
    const [rows] = await pool.execute(
      `
      SELECT emoji, COUNT(*) as count, GROUP_CONCAT(user_name) as users
      FROM (
        SELECT r.emoji, u.name as user_name
        FROM reactions r
        JOIN users u ON r.user_id = u.id
        WHERE r.message_id = ?
      ) as reaction_data
      GROUP BY emoji
      ORDER BY count DESC
    `,
      [messageId]
    );
    return rows;
  }
}

module.exports = Reaction;
