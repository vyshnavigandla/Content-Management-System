// server.js
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { startScheduler } = require('./utils/ContentScheduler');

connectDB().then(() => startScheduler());

const app = express();
const server = http.createServer(app);

// ✅ CORS - Allow all origins for testing (then restrict later)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://content-management-system-14njkovll-gandla-vyshnavi.vercel.app',
  'https://content-management-system-hh2r2a18p-gandla-vyshnavi.vercel.app',
  'https://content-management-system-topaz.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean);

// ✅ Socket.io CORS
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        console.log('Blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
});

global.io = io;

io.on('connection', (socket) => {
  console.log('🟢 New client connected:', socket.id);
  const queryUserId = socket.handshake.query.userId;
  if (queryUserId) {
    socket.join(queryUserId);
    socket.userId = queryUserId;
    console.log(`👤 User ${queryUserId} auto-joined their room`);
  }
  // ... rest of socket handlers
});

// ✅ Express CORS
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Department CMS API is running',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/content', require('./routes/contentRoutes'));
app.use('/api/profiles', require('./routes/profileRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/student-profiles', require('./routes/studentProfileRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`CORS allowed origins:`, allowedOrigins);
});