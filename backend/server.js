import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import userRoutes from "./routes/users.js";
import messageRoutes from "./routes/messages.js";
import roomRoutes from "./routes/rooms.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Track connected users and their socket IDs
const connectedUsers = new Map();

/* =========================
   SOCKET.IO CONFIG
========================= */
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://chat-sphere-tan.vercel.app"
    ],
    methods: ["GET", "POST"]
  }
});

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());

/* =========================
   REST ROUTES
========================= */
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/rooms", roomRoutes);

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("✅ ChatSphere Backend Running");
});

// Helper function to get all online users
const getOnlineUsers = () => {
  return Array.from(connectedUsers.keys());
};

/* =========================
   SOCKET EVENTS
========================= */
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // Handle user authentication and track online status
  socket.on("authenticate", ({ userId }) => {
    if (userId) {
      connectedUsers.set(userId, socket.id);
      // Notify all clients about the updated online users list
      io.emit('online_users', { users: getOnlineUsers() });
      console.log(`User ${userId} authenticated with socket ${socket.id}`);
    }
  });

  // Handle user going online
  socket.on("user_online", ({ userId }) => {
    if (userId) {
      connectedUsers.set(userId, socket.id);
      io.emit('user_online', { userId });
      console.log(`User ${userId} is now online`);
    }
  });

  // Handle user going offline
  socket.on("user_offline", ({ userId }) => {
    if (userId) {
      connectedUsers.delete(userId);
      io.emit('user_offline', { userId });
      console.log(`User ${userId} is now offline`);
    }
  });

  // Handle room joining
  socket.on("join_room", (data) => {
    const { roomId, userName } = typeof data === 'string' ? { roomId: data, userName: 'Anonymous' } : data;
    socket.join(roomId);
    console.log(`User ${userName || socket.id} joined room ${roomId}`);
    
    // Broadcast to room that user has joined
    if (userName) {
      io.to(roomId).emit('receive_system_message', {
        message: {
          id: `sys-${Date.now()}`,
          author: { id: 'system', name: 'System' },
          text: `${userName} has joined the room`,
          timestamp: Date.now(),
          isSystem: true
        }
      });
    }
  });

  // Handle sending messages
  socket.on("send_message", (message) => {
    if (message.roomId) {
      // Add delivered status to the message
      const messageWithStatus = {
        ...message,
        status: 'delivered',
        timestamp: message.timestamp || Date.now()
      };
      
      // Broadcast to the room
      io.to(message.roomId).emit("receive_message", { message: messageWithStatus });
      
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
        timestamp: Date.now()
      });
      
      // Also send to the sender (for debugging and consistency)
      socket.emit('user_typing', {
        userId,
        roomId,
        isTyping,
        timestamp: Date.now(),
        isSelf: true
      });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
    
    // Find and remove the disconnected user
    let disconnectedUserId = null;
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        connectedUsers.delete(userId);
        break;
      }
    }
    
    // Notify all clients if a user went offline
    if (disconnectedUserId) {
      io.emit('user_offline', { userId: disconnectedUserId });
      console.log(`User ${disconnectedUserId} went offline`);
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
