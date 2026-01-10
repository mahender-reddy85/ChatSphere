import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Create a root
const root = createRoot(document.getElementById('root'));

// Initial render: Render the App component
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
