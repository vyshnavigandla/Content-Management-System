// models/User.js
// Mongoose schema for all three roles: HOD, Faculty, Student.
// We use ONE collection with a `role` field rather than 3 separate
// collections, because all roles share the same login mechanism
// (email + password) and most profile fields overlap.

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // no two users can share an email
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // never return password field in queries by default
    },
    role: {
      type: String,
      enum: ['hod', 'faculty', 'student'],
      required: true,
    },

    // --- Student-specific fields ---
    rollNumber: { type: String, trim: true },
    semester: { type: Number },

    // --- Faculty / HOD-specific fields ---
    designation: { type: String, trim: true }, // e.g. "Assistant Professor"

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// --- Mongoose middleware (hook) ---
// This runs automatically BEFORE a document is saved.
// We hash the password here so controllers never have to remember to do it.
userSchema.pre('save', async function (next) {
  // Only re-hash if the password field was actually changed
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10); // generates random "salt" for hashing
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// --- Instance method ---
// Compares a plain-text password (from login form) with the hashed
// password stored in the database. Returns true/false.
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);