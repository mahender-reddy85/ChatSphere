import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db.js';
import userRoutes from './routes/users.js';
import messageRoutes from './routes/messages.js';
import roomRoutes from './routes/rooms.js';

dotenv.config({ path: './backend/.env' });

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/rooms', roomRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('✅ ChatSphere Backend Running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
