// api/axios.js
// A pre-configured Axios instance. Every API call in the app should
// import THIS instead of axios directly, so the base URL and JWT
// attachment logic only need to be written once.

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor: runs before every request is sent.
// Reads the JWT from localStorage and attaches it as a Bearer token.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: if the server says the token is invalid/expired
// (401), automatically log the user out and send them to /login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;