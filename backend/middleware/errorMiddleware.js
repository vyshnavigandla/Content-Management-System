// middleware/errorMiddleware.js
// Two middleware functions: one for unknown routes (404),
// one for converting all errors into a consistent JSON response.

// Runs when no route matches the request
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error); // forward to errorHandler below
};

// Express recognizes this as an error handler because it takes 4 arguments
const errorHandler = (err, req, res, next) => {
  // If a controller already set a status code (e.g. 400, 404), use it.
  // Otherwise default to 500 (Internal Server Error).
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Internal Server Error';

  // Handle invalid MongoDB ObjectId (e.g. /api/content/123 where 123 isn't valid)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    message = err.message; // e.g. "File too large"
  }

  // Handle Mongoose schema validation errors (e.g. missing required field)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
  }

  // Handle duplicate key errors (e.g. registering with an email that already exists)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate value entered for field: ${field}`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only show the stack trace in development - never expose it in production
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };