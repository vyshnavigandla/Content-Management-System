// middleware/roleMiddleware.js
// "authorize" middleware: restricts a route to specific roles.
// Must be used AFTER "protect" (so req.user already exists).
//
// Usage example:
//   router.put('/:id/approve', protect, authorize('hod'), approveContent);
// -> only logged-in users with role === 'hod' can call this route.

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized, no user found on request');
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Access denied. Role '${req.user.role}' cannot perform this action`);
    }

    next();
  };
};

module.exports = { authorize };