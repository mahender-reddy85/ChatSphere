const store = require('../inMemoryStore');

class User {
  static async create(userData) {
    return await store.createUser(userData);
  }

  static async findById(id) {
    return await store.findUserById(id);
  }

  static async findByEmail(email) {
    // Find user by email in the in-memory store
    for (const [id, user] of store.users) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  static async update(id, updates) {
    const user = await store.findUserById(id);
    if (!user) return false;
    
    // Update user properties
    Object.assign(user, updates);
    store.users.set(id, user);
    return true;
  }

  static async updateOnlineStatus(id, isOnline) {
    const user = await store.findUserById(id);
    if (!user) return false;
    
    user.is_online = isOnline;
    user.last_seen = new Date();
    store.users.set(id, user);
    return true;
  }

  static async getAll() {
    return Array.from(store.users.values());
  }
}

module.exports = User;
