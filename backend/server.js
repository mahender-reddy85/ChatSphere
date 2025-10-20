const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? "https://your-frontend-domain.com" : "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

// Test route for Render deployment verification
app.get('/', (req, res) => {
  res.send('✅ ChatSphere backend is live and running!');
});

const rooms = new Map(); // In-memory storage for rooms and messages

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('sendMessage', (data) => {
    const { roomId, message } = data;
    // Simulate saving to backend
    if (!rooms.has(roomId)) {
      rooms.set(roomId, []);
    }
    const roomMessages = rooms.get(roomId);
    roomMessages.push(message);
    
    // Emit to room
    io.to(roomId).emit('newMessage', { message });
    
    // Immediately confirm delivery to sender
    socket.emit('messageDelivered', { messageId: message.id });
    
    console.log(`Message sent in room ${roomId}:`, message.id);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
