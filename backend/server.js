// server.js
// Entry point of the backend application.
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config(); // load variables from .env into process.env

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Connect to MongoDB before starting the server
connectDB();

const app = express();

// --- Core Middleware ---
// Allow requests from our React frontend (different port during development)
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));

// Parse incoming JSON request bodies into req.body
app.use(express.json());

// --- Health Check Route ---
// Useful to quickly verify the server is running (visit http://localhost:5000/api/health)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Department CMS API is running',
    timestamp: new Date().toISOString(),
  });
});

// --- Future route imports will go here ---
 app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/content', require('./routes/contentRoutes'));
// --- Routes ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/content', require('./routes/contentRoutes'));
// --- Routes ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/content', require('./routes/contentRoutes'));
app.use('/api/profiles', require('./routes/profileRoutes'));
// --- Routes ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/content', require('./routes/contentRoutes'));
app.use('/api/profiles', require('./routes/profileRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Serve uploaded files statically so the frontend can display/download them
// e.g. http://localhost:5000/uploads/notes-1718000000000.pdf

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// --- Error Handling Middleware (must be LAST) ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
// --- Routes ---


app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});