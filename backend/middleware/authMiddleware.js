// middleware/authMiddleware.js
// "protect" middleware: checks that a valid JWT was sent with the request.
// If valid, attaches the logged-in user's data to req.user so that
// later middleware/controllers know WHO is making the request.

const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Tokens are sent as: Authorization: Bearer <token>
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract just the token part (after "Bearer ")
      token = req.headers.authorization.split(' ')[1];

      // Verify the token's signature and expiry using our secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch the user from DB (without password) and attach to req.user
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        res.status(401);
        throw new Error('User not found, authorization denied');
      }

      if (!req.user.isActive) {
        res.status(403);
        throw new Error('This account has been deactivated');
      }

      return next(); // user is verified, continue to the next middleware/controller
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, invalid or expired token');
    }
  }

  // No token was provided at all
  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }
});

module.exports = { protect };