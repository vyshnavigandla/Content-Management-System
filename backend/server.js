// server.js
// Fixes over the original:
//  1. Duplicate `app.use('/api/comments', ...)` removed.
//  2. Duplicate `io.on('connection', ...)` block removed (merged into one).
//  3. startScheduler() called after DB connects for content scheduling.

const path      = require('path');
const express   = require('express');
const dotenv    = require('dotenv');
const cors      = require('cors');
const http      = require('http');
const socketIo  = require('socket.io');

dotenv.config();

const connectDB              = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { startScheduler }     = require('./utils/contentScheduler');

// Connect to MongoDB, then kick off the scheduler
connectDB().then(() => startScheduler());

const app    = express();
const server = http.createServer(app);

// ── Socket.io ───────────────────────────────────────────────────────────────

const io = socketIo(server, {
  cors: {
    origin:      process.env.CLIENT_URL || 'http://localhost:5173',
    methods:     ['GET', 'POST'],
    credentials: true,
  },
});

global.io = io;

// Single connection handler (was duplicated in the original)
io.on('connection', (socket) => {
  console.log('🟢 New client connected:', socket.id);

  // Auto-join room from query string (for backward compat with older clients)
  const queryUserId = socket.handshake.query.userId;
  if (queryUserId) {
    socket.join(queryUserId);
    socket.userId = queryUserId;
    console.log(`👤 User ${queryUserId} auto-joined their room`);
  }

  // Explicit register event (preferred)
  socket.on('register', (userId) => {
    if (userId) {
      socket.join(userId);
      socket.userId = userId;
      console.log(`👤 User ${userId} joined their room`);
      socket.emit('registered', { userId, status: 'success' });
    }
  });

  socket.on('unregister', () => {
    if (socket.userId) {
      socket.leave(socket.userId);
      console.log(`👤 User ${socket.userId} left their room`);
      socket.userId = null;
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔴 Client disconnected: ${socket.id}${socket.userId ? ` (user ${socket.userId})` : ''}`);
  });
});

// ── Core middleware ─────────────────────────────────────────────────────────

app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    success:   true,
    message:   'Department CMS API is running',
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ──────────────────────────────────────────────────────────────────

app.use('/api/auth',             require('./routes/authRoutes'));
app.use('/api/content',          require('./routes/contentRoutes'));
app.use('/api/profiles',         require('./routes/profileRoutes'));
app.use('/api/admin',            require('./routes/adminRoutes'));
app.use('/api/student-profiles', require('./routes/studentProfileRoutes'));
app.use('/api/notifications',    require('./routes/notificationRoutes'));
app.use('/api/comments',         require('./routes/commentRoutes'));  // registered ONCE
app.use('/api/analytics',        require('./routes/analyticsRoutes'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Error handling (must be last) ───────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

// ── Start ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`Socket.io ready for real-time notifications`);
});