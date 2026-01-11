# ChatSphere - Real-time Chat Application with AI Integration

ChatSphere is a real-time chat application built with React, TypeScript, Node.js, Express, and Socket.IO.

## Features

- Real-time messaging
- User authentication
- Private and group chats
- Message reactions
- Typing indicators
- Online/offline status
- Responsive design

## Prerequisites

- Node.js (v18 or later)
- npm (v9 or later) or yarn
- PostgreSQL (for the backend)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/chatsphere.git
   cd chatsphere
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the environment variables:
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Update the environment variables with your configuration

4. Start the development servers:
   ```bash
   # Start both frontend and backend
   npm start
   
   # Or start them separately
   npm run start:frontend
   npm run start:backend
   ```

5. Open http://localhost:3000 to view the app in the browser.

## Available Scripts

- `npm start` - Start both frontend and backend in development mode
- `npm run build` - Build both frontend and backend for production
- `npm test` - Run tests for both frontend and backend
- `npm run lint` - Lint both frontend and backend code
- `npm run format` - Format code using Prettier
## Environment Variables

See `.env.example` for configuration. Key variables:

- `VITE_GEMINI_API_KEY`: Required for AI bot responses.
- `VITE_BASE_URL`: Optional for custom base paths in builds (e.g., subdomains).

Do not commit `.env.local` with real keys.

## Features

- Real-time messaging with Socket.io
- User authentication and rooms
- AI chat bot (Gemini)
- Polls, image sharing, video calls
- Responsive design with Tailwind CSS

## Troubleshooting

- **Blank page on GitHub Pages**: Ensure `VITE_BASE_URL` is set to '/repo-name/' during build.
- **No AI on Vercel**: Add `VITE_GEMINI_API_KEY` in Vercel env vars.
- **CSS not loading**: Verify Tailwind config and run `npm run build` to check `dist/` assets.
- **Local dev issues**: Check console for env warnings; ensure Node version compatibility.
