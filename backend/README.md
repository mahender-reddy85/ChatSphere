# ChatSphere Backend with PostgreSQL

This is the backend server for ChatSphere, built with Node.js, Express, Socket.IO, and PostgreSQL with Neon.

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL database (local or Neon)
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your database credentials

4. Run migrations to set up the database schema:
   ```bash
   npm run migrate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (for Neon, it will look like `postgresql://user:password@host:port/dbname?sslmode=require`)
- `JWT_SECRET`: Secret key for JWT token generation
- `PORT`: Port to run the server on (default: 3001)
- `NODE_ENV`: Environment (development/production)

## Database Schema

The database includes the following tables:

- `users`: Stores user information
- `rooms`: Chat rooms
- `room_members`: Many-to-many relationship between users and rooms
- `messages`: Chat messages

## API Endpoints

### Authentication

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/profile` - Update user profile

### Rooms

- `GET /api/rooms` - Get all rooms
- `POST /api/rooms` - Create a new room
- `GET /api/rooms/:roomId` - Get room details
- `POST /api/rooms/:roomId/join` - Join a room

### Messages

- `GET /api/messages/:roomId` - Get messages for a room
- `POST /api/messages` - Send a message
- `GET /api/messages/:roomId/history` - Get message history with pagination

## WebSocket Events

- `joinRoom` - Join a room
- `sendMessage` - Send a message to a room
- `receiveMessage` - Receive a message in a room
- `roomUpdated` - Room details updated

## Deployment

1. Make sure all environment variables are properly set in your production environment
2. Build your frontend and serve it with the backend or a CDN
3. Use a process manager like PM2 to keep the server running:
   ```bash
   npm install -g pm2
   pm2 start server.js --name chatsphere-backend
   ```

## License

MIT
