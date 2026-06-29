// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { io } from 'socket.io-client';
import './index.css';
import './App.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Add Inter font
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap';
document.head.appendChild(link);

// ✅ Fix: Use correct socket URL - ensure no trailing slash issues
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
  .replace('/api', '')
  .replace(/\/+$/, ''); // Remove trailing slash

console.log('🔌 Socket connecting to:', SOCKET_URL);

const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['polling', 'websocket'], // ✅ Try polling first, then upgrade to websocket
  upgrade: true,
  forceNew: true,
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

socket.on('disconnect', () => {
  console.log('🔌 Socket disconnected');
});

socket.on('connect_error', (err) => {
  console.error('Socket connect error:', err.message);
  console.log('🔄 Attempting to reconnect...');
});

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