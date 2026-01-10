const { pool, store } = require('../db');

class Room {
  static async create(roomData) {
    return await store.createRoom(roomData);
  }

  static async findById(id) {
    return await store.findRoomById(id);
  }

  static async getAll() {
    return Array.from(store.rooms.values());
  }

  static async getRoomsForUser(userId) {
    // Find all rooms where the user is a member
    const userRooms = [];
    for (const [roomId, room] of store.rooms) {
      if (room.members && room.members.has(userId)) {
        userRooms.push(room);
      }
    }
    return userRooms;
  }

  static async addUser(roomId, userId) {
    const room = await store.findRoomById(roomId);
    if (!room) return false;
    
    if (!room.members) {
      room.members = new Set();
    }
    
    room.members.add(userId);
    store.rooms.set(roomId, room);
    return true;
  }

  static async removeUser(roomId, userId) {
    const room = await store.findRoomById(roomId);
    if (!room || !room.members) return false;
    
    return room.members.delete(userId);
  }

  static async getUsers(roomId) {
    const [rows] = await pool.execute(
      `
      SELECT u.* FROM users u
      JOIN room_users ru ON u.id = ru.user_id
      WHERE ru.room_id = ?
    `,
      [roomId]
    );
    return rows;
  }

  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM rooms WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Room;
