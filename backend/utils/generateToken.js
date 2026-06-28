// utils/generateToken.js
// Creates a signed JWT containing the user's id and role.
// The frontend stores this token and sends it back on every
// request in the "Authorization: Bearer <token>" header.

const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },              // payload: data embedded inside the token
    process.env.JWT_SECRET,     // secret key used to sign the token
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = generateToken;