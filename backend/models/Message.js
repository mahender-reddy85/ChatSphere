const pool = require('../db');

class Message {
  static async create(messageData) {
    const {
      id,
      roomId,
      authorId,
      text,
      type,
      timestamp,
      isEdited,
      isPinned,
      replyTo,
      fileUrl,
      fileName,
      fileType,
      audioUrl,
      audioDuration,
      locationLat,
      locationLng,
    } = messageData;

    const [result] = await pool.execute(
      `
      INSERT INTO messages (
        id, room_id, author_id, text, type, timestamp, is_edited, is_pinned,
        reply_to, file_url, file_name, file_type, audio_url, audio_duration,
        location_lat, location_lng
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        id,
        roomId,
        authorId,
        text,
        type,
        timestamp,
        isEdited,
        isPinned,
        replyTo,
        fileUrl,
        fileName,
        fileType,
        audioUrl,
        audioDuration,
        locationLat,
        locationLng,
      ]
    );

    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM messages WHERE id = ?', [id]);
    return rows[0];
  }

  static async getByRoomId(roomId, limit = 50, offset = 0) {
    const [rows] = await pool.execute(
      `
      SELECT m.*, u.name as author_name, u.profile_picture as author_profile_picture
      FROM messages m
      LEFT JOIN users u ON m.author_id = u.id
      WHERE m.room_id = ? AND m.is_deleted = FALSE
      ORDER BY m.timestamp DESC
      LIMIT ? OFFSET ?
    `,
      [roomId, limit, offset]
    );
    return rows.reverse(); // Reverse to get chronological order
  }

  static async update(id, updates) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field) => `${field} = ?`).join(', ');
    const [result] = await pool.execute(`UPDATE messages SET ${setClause} WHERE id = ?`, [
      ...values,
      id,
    ]);
    return result.affectedRows > 0;
  }

  static async softDelete(id, deletedBy) {
    const [result] = await pool.execute(
      'UPDATE messages SET is_deleted = TRUE, deleted_by = ? WHERE id = ?',
      [deletedBy, id]
    );
    return result.affectedRows > 0;
  }

  static async togglePin(id) {
    const [result] = await pool.execute(
      'UPDATE messages SET is_pinned = NOT is_pinned WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async getPinned(roomId) {
    const [rows] = await pool.execute(
      `
      SELECT m.*, u.name as author_name, u.profile_picture as author_profile_picture
      FROM messages m
      LEFT JOIN users u ON m.author_id = u.id
      WHERE m.room_id = ? AND m.is_pinned = TRUE AND m.is_deleted = FALSE
      ORDER BY m.timestamp DESC
    `,
      [roomId]
    );
    return rows;
  }

  static async search(roomId, query, limit = 20) {
    const [rows] = await pool.execute(
      `
      SELECT m.*, u.name as author_name, u.profile_picture as author_profile_picture
      FROM messages m
      LEFT JOIN users u ON m.author_id = u.id
      WHERE m.room_id = ? AND m.text LIKE ? AND m.is_deleted = FALSE
      ORDER BY m.timestamp DESC
      LIMIT ?
    `,
      [roomId, `%${query}%`, limit]
    );
    return rows;
  }
}

module.exports = Message;
