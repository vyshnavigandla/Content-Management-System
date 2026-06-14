// context/AuthContext.jsx
// Provides global authentication state (current user + token) to the
// entire app via React Context. Persists to localStorage so the user
// stays logged in across page refreshes.

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, check if we have a saved token + user and restore the session
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Called by the Login page after a successful /api/auth/login call
  const login = (userData) => {
    // userData looks like: { _id, name, email, role, token }
    const { token, ...userInfo } = userData;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userInfo));
    setUser(userInfo);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for easy access: const { user, login, logout } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}