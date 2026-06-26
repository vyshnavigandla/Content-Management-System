// models/FacultyProfile.js

const mongoose = require('mongoose');

const facultyProfileSchema = new mongoose.Schema(
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

    qualifications: {
      type: [String],
      default: [],
    },

    researchInterests: {
      type: [String],
      default: [],
    },

    publications: {
      type: [String],
      default: [],
    },

    bio: {
      type: String,
      default: '',
      maxlength: 1000,
      trim: true,
    },

    // Alumni Information
    isAlumnus: {
      type: Boolean,
      default: false,
    },

    alumniBatchYear: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear(),
      default: null,
    },

    mentorshipAreas: {
      type: [String],
      default: [],
    },

    // New Fields (Recommended)
    officeLocation: {
      type: String,
      default: '',
    },

    contactNumber: {
      type: String,
      default: '',
    },

    linkedinUrl: {
      type: String,
      default: '',
    },

    googleScholarUrl: {
      type: String,
      default: '',
    },

    personalWebsite: {
      type: String,
      default: '',
    },

    yearsOfExperience: {
      type: Number,
      default: 0,
      min: 0,
    },

    availableForMentorship: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('FacultyProfile', facultyProfileSchema);