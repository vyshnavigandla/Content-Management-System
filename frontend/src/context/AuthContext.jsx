// context/AuthContext.jsx
// FIX: original file had login and logout defined twice — once as inline
// function stubs (never exported) and again as useCallback versions.
// The stubs shadowed the real implementations in some bundler orders.
// Cleaned up to a single definition each.

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Restore session from localStorage on first load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        const token     = localStorage.getItem('token');

        if (savedUser && token) {
          const parsedUser = JSON.parse(savedUser);
          if (parsedUser._id && parsedUser.email && parsedUser.role) {
            setUser(parsedUser);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } catch (err) {
        console.error('Error restoring auth state:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  // Called after a successful /api/auth/login response
  const login = useCallback((userData) => {
    try {
      const { token, ...userInfo } = userData;
      if (!token || !userInfo._id || !userInfo.email || !userInfo.role) {
        throw new Error('Invalid user data received');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userInfo));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userInfo);
      setError(null);

      // Register with socket for real-time notifications
      const registerWithSocket = () => {
        if (window.socket?.connected) {
          window.socket.emit('register', userInfo._id);
        }
      };

      if (window.socket?.connected) {
        registerWithSocket();
      } else if (window.socket) {
        window.socket.once('connect', registerWithSocket);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to complete login. Please try again.');
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setError(null);

      if (window.socket) {
        window.socket.emit('unregister');
        // Don't disconnect; socket will reconnect on next login automatically
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  const value = {
    user,
    login,
    logout,
    loading,
    error,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}