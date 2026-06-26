// utils/contentScheduler.js
// Polls for content whose scheduledPublishAt has passed and publishes it.
// Call startScheduler() once from server.js after DB connects.
//
// Design notes:
//  - Runs every minute (configurable via SCHEDULER_INTERVAL_MS env var).
//  - Uses findOneAndUpdate with a status check so concurrent server
//    instances (if you ever run more than one) don't double-publish.
//  - Errors in one cycle are logged but do NOT crash the server.

const Content = require('../models/Content');
const logAction = require('./auditLogger');
const { createNotification } = require('./notificationHelper');

const INTERVAL_MS = parseInt(process.env.SCHEDULER_INTERVAL_MS || '60000', 10);

let schedulerHandle = null;

const publishDueContent = async () => {
  try {
    const now = new Date();

    // Find all content items that are scheduled and past their publish time.
    // We only schedule items that have been approved (status pending_approval)
    // OR drafts that the HOD pre-scheduled (edge case).
    const dueItems = await Content.find({
      scheduledPublishAt: { $lte: now },
      status: { $in: ['pending_approval', 'draft'] },
    }).populate('createdBy', 'name email');

    for (const content of dueItems) {
      // Atomic update - prevents race conditions on multi-instance deploys
      const updated = await Content.findOneAndUpdate(
        {
          _id: content._id,
          scheduledPublishAt: { $lte: now },
          status: { $in: ['pending_approval', 'draft'] },
        },
        {
          $set: {
            status:             'published',
            publishedAt:        now,
            scheduledPublishAt: null,
          },
        },
        { new: true }
      );

      if (!updated) continue; // another instance already handled it

      console.log(`[Scheduler] Published: "${updated.title}" (${updated._id})`);

      // Audit trail
      await logAction({
        // No acting user for system actions - use a sentinel ObjectId or
        // the content creator so the log is readable
        user:     content.createdBy._id,
        action:   'CONTENT_SCHEDULED_PUBLISH',
        targetId: updated._id,
        remarks:  `"${updated.title}" auto-published by scheduler`,
      });

      // Notify the author
      await createNotification({
        recipient: content.createdBy._id,
        type:      'content_published',
        title:     'Your content has been published',
        message:   `"${updated.title}" was automatically published as scheduled.`,
        link:      `/content/${updated._id}`,
        metadata:  { contentId: updated._id },
      });
    }
  } catch (err) {
    console.error('[Scheduler] Error during publish cycle:', err.message);
  }
};

const startScheduler = () => {
  if (schedulerHandle) return; // already running
  console.log(`[Scheduler] Starting content scheduler (interval: ${INTERVAL_MS}ms)`);
  // Run once immediately on boot, then on interval
  publishDueContent();
  schedulerHandle = setInterval(publishDueContent, INTERVAL_MS);
};

const stopScheduler = () => {
  if (schedulerHandle) {
    clearInterval(schedulerHandle);
    schedulerHandle = null;
    console.log('[Scheduler] Stopped');
  }
};

module.exports = { startScheduler, stopScheduler, publishDueContent };