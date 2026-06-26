// models/StudentProfile.js
// Extended profile for students - skills, interests, and current project.
// Mirrors FacultyProfile (Phase 6) for consistency: auth data stays in
// User, display/showcase data lives here.

const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    photo: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
      maxlength: 500,
    },
    skills: [{ type: String }],       // e.g. ["React", "Python", "Machine Learning"]
    interests: [{ type: String }],    // e.g. ["Web Development", "IoT"]

    // --- Current project (optional) ---
    currentProject: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      status: {
        type: String,
        enum: ['idea', 'in_progress', 'completed'],
        default: 'idea',
      },
      lookingForTeammates: { type: Boolean, default: false },
      requiredSkills: [{ type: String }], // skills they're looking for in teammates
    },

    pastProjects: [{ type: String }], // titles, for showcase display
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentProfile', studentProfileSchema);