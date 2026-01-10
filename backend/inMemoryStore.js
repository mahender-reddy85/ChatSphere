// In-memory data store
const store = {
  users: new Map(),
  rooms: new Map(),
  messages: new Map(),
  polls: new Map(),
  reactions: new Map(),
  
  // User methods
  async createUser(userData) {
    const id = Date.now().toString();
    const user = { ...userData, id };
    this.users.set(id, user);
    return user;
  },
  
  async findUserById(id) {
    return this.users.get(id);
  },
  
  // Room methods
  async createRoom(roomData) {
    const id = Date.now().toString();
    const room = { ...roomData, id, members: new Set() };
    this.rooms.set(id, room);
    return room;
  },
  
  async findRoomById(id) {
    return this.rooms.get(id);
  },
  
  // Message methods
  async createMessage(messageData) {
    const id = Date.now().toString();
    const message = { ...messageData, id, timestamp: new Date() };
    if (!this.messages.has(message.roomId)) {
      this.messages.set(message.roomId, []);
    }
    this.messages.get(message.roomId).push(message);
    return message;
  },
  
  async getMessagesByRoom(roomId) {
    return this.messages.get(roomId) || [];
  },
  
  // Add more methods as needed for other models
};

module.exports = store;
