const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://chat-sphere-tan.vercel.app', 'https://*.vercel.app'] 
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ ChatSphere backend is live and running!');
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API route working fine!' });
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('send_message', (data) => {
    const { roomId, message } = data;
    // Emit to all clients in the room, excluding the sender
    socket.to(roomId).emit('receive_message', { message });

    // Confirm delivery to sender
    socket.emit('message_delivered', { messageId: message.id });

    console.log(`Message sent in room ${roomId}:`, message.id);
  });

  socket.on('create_room', (data) => {
    const { roomId, userName } = data;
    const systemMessage = {
      id: `msg-system-${Date.now()}`,
      timestamp: Date.now(),
      text: `${userName} created the room`,
      type: 'system',
      reactions: [],
      roomId
    };
    io.to(roomId).emit('receive_system_message', { message: systemMessage });
    console.log(`Room created: ${roomId} by ${userName}`);
  });

  socket.on('join_room', (data) => {
    const { roomId, userName } = data;
    const systemMessage = {
      id: `msg-system-${Date.now()}`,
      timestamp: Date.now(),
      text: `${userName} joined the room`,
      type: 'system',
      reactions: [],
      roomId
    };
    io.to(roomId).emit('receive_system_message', { message: systemMessage });
    console.log(`${userName} joined room ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
