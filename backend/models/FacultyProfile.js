// models/FacultyProfile.js
// Extended profile information for Faculty and HOD users.
// Kept separate from the User model because:
//  - User = login/auth concerns (email, password, role)
//  - FacultyProfile = public-facing display info (photo, bio, publications)
// This separation means profile edits never touch sensitive auth fields.

const mongoose = require('mongoose');

const facultyProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one profile per user
    },
    photo: {
      type: String, // file path saved by Multer, e.g. "/uploads/photo-12345.jpg"
      default: '',
    },
    qualifications: [{ type: String }],     // e.g. ["Ph.D. in CSE", "M.Tech"]
    researchInterests: [{ type: String }],  // e.g. ["Machine Learning", "IoT"]
    publications: [{ type: String }],       // e.g. titles or DOIs/links
    bio: {
      type: String,
      default: '',
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FacultyProfile', facultyProfileSchema);