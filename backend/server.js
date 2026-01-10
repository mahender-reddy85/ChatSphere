import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { testConnection } from './db.js';
import userRoutes from './routes/users.js';
import messageRoutes from './routes/messages.js';
import roomRoutes from './routes/rooms.js';

dotenv.config();

const app = express();
const server = createServer(app);

// Track connected users and their socket data
const connectedUsers = new Map(); // userId -> { socketId, username, joinedRooms }

// Track all active rooms and their participants
const activeRooms = new Map(); // roomId -> Set of userIds

// Helper function to safely emit events with error handling
const safeEmit = (socket, event, data, callback) => {
  try {
    if (typeof callback === 'function') {
      socket.emit(event, data, callback);
    } else {
      socket.emit(event, data);
    }
  } catch (error) {
    console.error(`Error emitting ${event}:`, error);
  }
};

// Test database connection on startup
testConnection().then(isConnected => {
  if (!isConnected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }
});

/* =========================
   SOCKET.IO CONFIG
========================= */
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'https://chat-sphere-tan.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  },
  pingTimeout: 60000, // Increase timeout to 60 seconds
  pingInterval: 25000, // Send ping every 25 seconds
  maxHttpBufferSize: 1e8, // 100MB max message size
  connectionStateRecovery: {
    // Enable reconnection with state recovery
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true
  }
});

// Track connection stats
const connectionStats = {
  totalConnections: 0,
  activeConnections: 0,
  peakConnections: 0,
  rooms: 0,
  users: 0,
  lastDisconnect: null,
  startTime: new Date()
};

// Log connection stats periodically
setInterval(() => {
  const now = new Date();
  console.log('\n📊 Connection Stats:');
  console.log(`🕒 Uptime: ${Math.floor((now - connectionStats.startTime) / 1000)}s`);
  console.log(`👥 Active Users: ${connectionStats.activeConnections}`);
  console.log(`🏠 Active Rooms: ${connectionStats.rooms}`);
  console.log(`📈 Peak Connections: ${connectionStats.peakConnections}`);
  console.log('--------------------------\n');
}, 300000); // Log every 5 minutes

// Make io accessible to routes
app.set('io', io);

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());

/* =========================
   REST ROUTES
========================= */
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/rooms', roomRoutes);

/* =========================
   HEALTH CHECK
========================= */
app.get('/', (req, res) => {
  res.send('✅ ChatSphere Backend Running');
});

// Helper function to get all online users
const getOnlineUsers = () => {
  return Array.from(connectedUsers.keys());
};

/* =========================
   SOCKET EVENTS
========================= */
io.on('connection', (socket) => {
  console.log(`🟢 New connection: ${socket.id}`);
  
  // ✅ ALWAYS initialize here for every socket
  socket.data.joinedRooms = new Set();
  
  // Update connection stats
  connectionStats.totalConnections++;
  connectionStats.activeConnections++;
  connectionStats.peakConnections = Math.max(
    connectionStats.peakConnections, 
    connectionStats.activeConnections
  );

  console.log(`Active connections: ${connectionStats.activeConnections}`);
  
  // Set up heartbeat for connection monitoring
  let isAlive = true;
  const heartbeatInterval = setInterval(() => {
    if (!isAlive) {
      console.log(`No heartbeat from ${socket.id}, disconnecting...`);
      return socket.disconnect(true);
    }
    isAlive = false;
    socket.emit('ping');
  }, 30000); // 30 seconds

  socket.on('pong', () => {
    isAlive = true;
  });

  // Clean up on disconnect
  socket.on('disconnect', (reason) => {
    console.log(`🔴 User disconnected (${socket.id}): ${reason}`);
    
    // Clean up rooms
    if (socket.data.joinedRooms) {
      socket.data.joinedRooms.forEach(roomId => {
        socket.leave(roomId);
        console.log(`User left room ${roomId} on disconnect`);
      });
    }
    
    clearInterval(heartbeatInterval);
    connectionStats.activeConnections--;
    connectionStats.lastDisconnect = new Date();
    console.log(`Active connections: ${connectionStats.activeConnections}`);
  });

  // Handle user authentication and track online status
  socket.on('authenticate', ({ userId }) => {
    if (userId) {
      connectedUsers.set(userId, socket.id);
      // Notify all clients about the updated online users list
      io.emit('online_users', { users: getOnlineUsers() });
      console.log(`User ${userId} authenticated with socket ${socket.id}`);
    }
  });

  // Handle user going online
  socket.on('user_online', ({ userId }) => {
    if (userId) {
      connectedUsers.set(userId, socket.id);
      io.emit('user_online', { userId });
      console.log(`User ${userId} is now online`);
    }
  });

  // Handle user going offline
  socket.on('user_offline', ({ userId }) => {
    if (userId) {
      connectedUsers.delete(userId);
      io.emit('user_offline', { userId });
      console.log(`User ${userId} is now offline`);
    }
  });

    // Handle room joining with validation and duplicate prevention
  socket.on('join_room', (data, callback) => {
    try {
      // ✅ extra safety: if for any reason it's missing, recreate
      if (!socket.data.joinedRooms) socket.data.joinedRooms = new Set();
      
      // Validate input
      if (!data) {
        throw new Error('Join data is required');
      }
      
      const { roomId, userName, userId } = typeof data === 'string' 
        ? { roomId: data, userName: 'Anonymous', userId: null }
        : { ...data, userId: data.userId || null };

      if (!roomId) {
        throw new Error('roomId is required');
      }

      // Get or create user data if userId is provided
      let userData = null;
      if (userId) {
        userData = connectedUsers.get(userId) || { 
          socketId: socket.id, 
          username: userName || 'Anonymous',
          joinedRooms: new Set() 
        };
        connectedUsers.set(userId, userData);
      }

      // Check if already in room
      if (socket.data.joinedRooms.has(roomId)) {
        console.log(`User ${userName || userId || socket.id} already in room ${roomId}`);
        safeEmit(socket, 'join_room_response', { 
          success: true, 
          roomId, 
          message: 'Already in room',
          isDuplicate: true 
        }, callback);
        return;
      }

      // Join room and update tracking
      socket.join(roomId);
      socket.data.joinedRooms.add(roomId);
      
      // Update user data if available
      if (userData) {
        userData.joinedRooms.add(roomId);
        userData.username = userName || userData.username || 'Anonymous';
        userData.socketId = socket.id; // Update socket ID in case of reconnection
      }
      
      console.log(`User ${userName || userId || 'Anonymous'} joined room ${roomId}`);

      // Broadcast to room that user has joined (except sender)
      if (userName) {
        socket.to(roomId).emit('receive_system_message', {
          message: {
            id: `sys-${Date.now()}`,
            author: { id: 'system', name: 'System' },
            text: `${userName} has joined the room`,
            timestamp: Date.now(),
            isSystem: true,
          },
        });
      }

      // Send success response to the client
      safeEmit(socket, 'join_room_response', { 
        success: true, 
        roomId, 
        message: `Successfully joined room ${roomId}`
      }, callback);
      
    } catch (error) {
      console.error('Error joining room:', error);
      safeEmit(socket, 'error', { 
        event: 'join_room', 
        error: error.message 
      }, callback);
    }
  });

  // Handle sending messages
  socket.on('send_message', (message) => {
    if (message.roomId) {
      // Add delivered status to the message
      const messageWithStatus = {
        ...message,
        status: 'delivered',
        timestamp: message.timestamp || Date.now(),
      };

      // Broadcast to the room
      io.to(message.roomId).emit('receive_message', { message: messageWithStatus });

      // Notify sender that message was delivered
      if (message.author && message.author.id) {
        socket.emit('message_delivered', { messageId: message.id });
      }
    }
  });

  // Handle typing indicators
  socket.on('typing', ({ roomId, userId, isTyping }) => {
    console.log(`User ${userId} is ${isTyping ? 'typing' : 'not typing'} in room ${roomId}`);
    if (roomId && userId) {
      // Broadcast to everyone in the room except the sender
      socket.to(roomId).emit('user_typing', {
        userId,
        roomId,
        isTyping,
        timestamp: Date.now(),
      });

      // Also send to the sender (for debugging and consistency)
      socket.emit('user_typing', {
        userId,
        roomId,
        isTyping,
        timestamp: Date.now(),
        isSelf: true,
      });
    }
  });

  // Handle disconnection with cleanup
  socket.on('disconnect', (reason) => {
    console.log(`🔴 User disconnected (${socket.id}):`, reason || 'Unknown reason');

    // Find and clean up the disconnected user
    let disconnectedUser = null;
    
    // Find the user by socket ID
    for (const [userId, userData] of connectedUsers.entries()) {
      if (userData.socketId === socket.id) {
        disconnectedUser = { userId, ...userData };
        
        // Leave all joined rooms
        if (disconnectedUser.joinedRooms) {
          disconnectedUser.joinedRooms.forEach(roomId => {
            // Remove from room tracking
            if (activeRooms.has(roomId)) {
              activeRooms.get(roomId).delete(userId);
              
              // Clean up empty rooms
              if (activeRooms.get(roomId).size === 0) {
                activeRooms.delete(roomId);
              } else {
                // Notify room that user left
                io.to(roomId).emit('receive_system_message', {
                  message: {
                    id: `sys-${Date.now()}`,
                    author: { id: 'system', name: 'System' },
                    text: `${disconnectedUser.username || 'A user'} has left the room`,
                    timestamp: Date.now(),
                    isSystem: true,
                  },
                });
              }
            }
            
            // Leave the socket room
            socket.leave(roomId);
          });
        }
        
        // Remove from connected users
        connectedUsers.delete(userId);
        console.log(`Cleaned up user ${userId} (${disconnectedUser.username || 'unknown'})`);
        
        // Notify all clients that user went offline
        io.emit('user_offline', { 
          userId,
          username: disconnectedUser.username,
          timestamp: Date.now()
        });
        
        break;
      }
    }
  });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
