// models/Content.js
const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    body: { type: String, required: [true, 'Content body is required'] },
    type: {
      type: String,
      enum: ['notice','circular','event','exam_schedule','study_material','placement_update','achievement'],
      required: true,
    },
    subject: { type: String, trim: true },
    semester: { type: Number },
    attachments: [{ type: String }],
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'published', 'rejected', 'archived'],
      default: 'draft',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewRemarks: { type: String, default: '' },
    downloadCount: { type: Number, default: 0 },
    publishedAt: { type: Date, default: null },
    viewCount: { type: Number, default: 0 },
    lastViewedAt: { type: Date },
    commentCount: { type: Number, default: 0 },
    tags: [{ type: String, trim: true }],
    category: {
      type: String,
      enum: ['academic', 'administrative', 'event', 'news', 'general'],
      default: 'general',
    },
    isFeatured: { type: Boolean, default: false },
    expiresAt: { type: Date, default: null },
    scheduledPublishAt: { type: Date, default: null },
    seo: {
      metaTitle: { type: String, default: '', trim: true },
      metaDescription: { type: String, default: '', trim: true },
      metaKeywords: [{ type: String, trim: true }],
      slug: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    },
    excerpt: { type: String, default: '', trim: true },
    featuredImage: { type: String, default: '' },
    readingTime: { type: Number, default: 0, min: 0 },
    version: { type: Number, default: 1 },
    previousVersions: [
      {
        title: String,
        body: String,
        attachments: [String],
        excerpt: { type: String, default: '' },
        featuredImage: { type: String, default: '' },
        updatedAt: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    // ✅ Comments field for discussion
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        text: {
          type: String,
          required: true,
          trim: true
        },
        type: {
          type: String,
          enum: ['question', 'feedback', 'suggestion', 'comment'],
          default: 'comment'
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
      targetAudience: {
      type: String,
      enum: ['ug', 'pg', 'both'],
      default: 'both',
    },
  },
  { timestamps: true }
);

contentSchema.index({ status: 1, type: 1 });
contentSchema.index({ createdBy: 1, status: 1 });
contentSchema.index({ tags: 1 });
contentSchema.index({ publishedAt: -1 });
contentSchema.index({ scheduledPublishAt: 1, status: 1 });

module.exports = mongoose.model('Content', contentSchema);