// utils/contentScheduler.js
const Content = require('../models/Content');
const logAction = require('./auditLogger');

const POLL_INTERVAL_MS = 60 * 1000;

const publishScheduled = async () => {
  try {
    const now = new Date();
    const due = await Content.find({
      status: { $in: ['draft', 'pending_approval'] },
      scheduledPublishAt: { $lte: now },
    });

    for (const content of due) {
      content.status = 'published';
      content.publishedAt = now;
      content.scheduledPublishAt = null;
      await content.save();

      await logAction({
        user: content.createdBy,
        action: 'CONTENT_SCHEDULED_PUBLISHED',
        targetId: content._id,
        remarks: `"${content.title}" auto-published by scheduler`,
      });

      console.log(`[Scheduler] Published: "${content.title}"`);
    }
  } catch (err) {
    console.error('[Scheduler] Error:', err.message);
  }
};

const startScheduler = () => {
  console.log('[Scheduler] Started');
  publishScheduled();
  setInterval(publishScheduled, POLL_INTERVAL_MS);
};

module.exports = { startScheduler };