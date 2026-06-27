// main.jsx
// FIX: socket.io URL had /api suffix which broke the handshake — stripped it
import React from 'react';
import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { io } from 'socket.io-client';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// FIX: strip /api so socket connects to server root, not /api path
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
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
socket.on('connect_error', (err) => console.error('Socket error:', err.message));

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);