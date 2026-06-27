// utils/notificationHelper.js
const Notification = require('../models/Notification');

const createNotification = async ({ recipient, sender, type, title, message, link = '#', metadata = {} }) => {
  try {
    const notification = await Notification.create({ recipient, sender, type, title, message, link, metadata });
    if (global.io) {
      global.io.to(recipient.toString()).emit('new_notification', notification);
    }
    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

const notifyContentStatusChange = async (content, actor, action) => {
  const authorId = content.createdBy?._id || content.createdBy;
  if (!authorId || authorId.toString() === actor._id.toString()) return;

  const messages = {
    submitted: {
      type: 'content_submitted',
      title: 'Content submitted for review',
      message: `"${content.title}" has been submitted for approval.`,
    },
    approved: {
      type: 'content_approved',
      title: ' Content approved',
      message: `Your content "${content.title}" was approved and published by ${actor.name}.`,
    },
    rejected: {
      type: 'content_rejected',
      title: 'Content rejected',
      message: `Your content "${content.title}" was rejected by ${actor.name}. Check the remarks.`,
    },
  };

  const payload = messages[action];
  if (!payload) return;

  await createNotification({
    recipient: authorId,
    sender: actor._id,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    link: `/content/${content._id}`,
    metadata: { contentId: content._id },
  });
};

module.exports = { createNotification, notifyContentStatusChange };