const pool = require('../db');

class Poll {
  static async create(pollData) {
    const { id, messageId, question, location } = pollData;
    const [result] = await pool.execute(
      'INSERT INTO polls (id, message_id, question, location) VALUES (?, ?, ?, ?)',
      [id, messageId, question, location]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM polls WHERE id = ?', [id]);
    return rows[0];
  }

  static async getByMessageId(messageId) {
    const [rows] = await pool.execute('SELECT * FROM polls WHERE message_id = ?', [messageId]);
    return rows[0];
  }

  static async getOptions(pollId) {
    const [rows] = await pool.execute('SELECT * FROM poll_options WHERE poll_id = ?', [pollId]);
    return rows;
  }

  static async addOption(optionData) {
    const { id, pollId, text } = optionData;
    const [result] = await pool.execute(
      'INSERT INTO poll_options (id, poll_id, text) VALUES (?, ?, ?)',
      [id, pollId, text]
    );
    return result.insertId;
  }

  static async vote(optionId, userId) {
    const [result] = await pool.execute(
      'INSERT INTO poll_votes (poll_option_id, user_id) VALUES (?, ?)',
      [optionId, userId]
    );
    return result.insertId;
  }

  static async removeVote(optionId, userId) {
    const [result] = await pool.execute(
      'DELETE FROM poll_votes WHERE poll_option_id = ? AND user_id = ?',
      [optionId, userId]
    );
    return result.affectedRows > 0;
  }

  static async getVotes(pollId) {
    const [rows] = await pool.execute(
      `
      SELECT po.id as option_id, po.text, COUNT(pv.user_id) as vote_count,
             GROUP_CONCAT(u.name) as voters
      FROM poll_options po
      LEFT JOIN poll_votes pv ON po.id = pv.poll_option_id
      LEFT JOIN users u ON pv.user_id = u.id
      WHERE po.poll_id = ?
      GROUP BY po.id, po.text
    `,
      [pollId]
    );
    return rows;
  }

  static async hasUserVoted(optionId, userId) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM poll_votes WHERE poll_option_id = ? AND user_id = ?',
      [optionId, userId]
    );
    return rows[0].count > 0;
  }
}

module.exports = Poll;
