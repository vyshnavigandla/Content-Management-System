// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { io } from 'socket.io-client';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// --- Initialize Socket.io BEFORE rendering ---
const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

// Make socket globally available for the app
window.socket = socket;

// Socket event listeners
socket.on('connect', () => {
  console.log('🔌 Socket connected successfully');
  
  // If user is already logged in, register them
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      if (userData._id) {
        socket.emit('register', userData._id);
        console.log(`User ${userData.name} registered with socket`);
      }
    } catch (error) {
      console.error('Failed to parse user data:', error);
    }
  }
});

socket.on('disconnect', () => {
  console.log('🔌 Socket disconnected');
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error.message);
});

socket.on('new_notification', (notification) => {
  console.log('New notification received:', notification);
  // You can show a toast notification here
});

// --- Render the App ---
ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);