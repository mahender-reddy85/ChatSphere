import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    base: './',
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: process.env.NODE_ENV === 'development' ? {
        // Development proxy settings
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        '/socket.io': {
          target: 'ws://localhost:3001',
          ws: true,
          changeOrigin: true
        }
      } : undefined,
      cors: process.env.NODE_ENV === 'development' ? {
        origin: 'http://localhost:3000',
        credentials: true
      } : false
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
