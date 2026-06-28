// main.jsx
// FIX: socket.io URL had /api suffix which broke the handshake — stripped it
import React from 'react';
import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { io } from 'socket.io-client';
import './index.css';
import './App.css'; // ✅ Added App.css import
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// ✅ Add Inter font from Google Fonts
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap';
document.head.appendChild(link);

// ✅ Add favicon meta for better appearance
const faviconLink = document.createElement('link');
faviconLink.rel = 'icon';
faviconLink.type = 'image/svg+xml';
faviconLink.href = '/favicon.svg';
document.head.appendChild(faviconLink);

// ✅ Add theme color meta tag
const themeMeta = document.createElement('meta');
themeMeta.name = 'theme-color';
themeMeta.content = '#3b82f6';
document.head.appendChild(themeMeta);

// FIX: strip /api so socket connects to server root, not /api path
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket', 'polling'], // ✅ Add transport fallback
});

window.socket = socket;

socket.on('connect', () => {
  console.log('🔌 Socket connected');
  const saved = localStorage.getItem('user');
  if (saved) {
    try {
      const userData = JSON.parse(saved);
      if (userData._id) socket.emit('register', userData._id);
    } catch {
      // ignore
    }
  }
});

socket.on('disconnect', () => console.log('🔌 Socket disconnected'));
socket.on('connect_error', (err) => {
  console.error('Socket error:', err.message);
  console.log('🔄 Attempting to reconnect...');
});

// ✅ Add error handler for socket reconnection attempts
socket.io.on('reconnect_attempt', (attempt) => {
  console.log(`🔄 Reconnection attempt ${attempt}`);
});

socket.io.on('reconnect', () => {
  console.log('✅ Socket reconnected successfully');
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);