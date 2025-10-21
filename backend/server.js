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
  },
  maxHttpBufferSize: 1e8  // 100 MB for Socket.IO payloads
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));  // Increase JSON body limit
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // For form data

app.get('/', (req, res) => {
  res.send('✅ ChatSphere backend is live and running!');
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API route working fine!' });
});

app.get('/api/welcome', (req, res) => {
  console.log(`Request: ${req.method} ${req.path}`);
  res.json({ message: 'Welcome to ChatSphere!' });
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('send_message', (data) => {
    const { roomId, message } = data;
    // Emit to all clients in the room, including sender for sync
    io.to(roomId).emit('receive_message', { message });

    // Confirm delivery to sender
    socket.emit('message_delivered', { messageId: message.id });

    console.log(`Message sent in room ${roomId}:`, message.id);
  });

  socket.on('create_room', (data) => {
    const { roomId, userName } = data;
    socket.join(roomId);
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
    let roomId, userName;
    if (typeof data === 'string') {
      roomId = data;
      userName = null;
    } else {
      ({ roomId, userName } = data);
    }
    socket.join(roomId);
    if (userName) {
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
    } else {
      console.log(`User ${socket.id} joined room ${roomId}`);
    }
  });

  socket.on('vote_poll', (data) => {
    const { roomId, messageId, optionId, userId } = data;
    // Emit vote update to all clients in the room
    io.to(roomId).emit('poll_vote', { messageId, optionId, userId });
    console.log(`Vote in room ${roomId}: message ${messageId}, option ${optionId}, user ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
