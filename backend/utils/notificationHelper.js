// utils/notificationHelper.js
const Notification = require('../models/Notification');

const createNotification = async ({ 
  recipient, 
  sender, 
  type, 
  title, 
  message, 
  link = '#', 
  metadata = {} 
}) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      link,
      metadata
    });
    
    // Emit socket event for real-time updates
    if (global.io) {
      global.io.to(recipient.toString()).emit('new_notification', notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

// Helper for content workflow notifications
const notifyContentStatusChange = async (content, actor, action) => {
  const statusMap = {
    submitted: {
      recipient: content.createdBy,
      title: 'Content Submitted for Approval',
      message: `Your content "${content.title}" has been submitted for review.`,
      type: 'content_submitted'
    },
    approved: {
      recipient: content.createdBy,
      title: 'Content Approved',
      message: `Your content "${content.title}" has been approved and published.`,
      type: 'content_approved'
    },
    rejected: {
      recipient: content.createdBy,
      title: 'Content Rejected',
      message: `Your content "${content.title}" was rejected. Reason: ${content.reviewRemarks || 'No reason provided'}`,
      type: 'content_rejected'
    }
  };
  
  const notificationData = statusMap[action];
  if (!notificationData) return;
  
  // For submitted, notify HODs
  if (action === 'submitted') {
    const User = require('../models/User');
    const hods = await User.find({ role: 'hod', isActive: true });
    
    for (const hod of hods) {
      await createNotification({
        recipient: hod._id,
        sender: actor._id,
        type: 'content_submitted',
        title: 'New Content Pending Approval',
        message: `${actor.name} submitted "${content.title}" for approval.`,
        link: `/approvals`,
        metadata: { contentId: content._id }
      });
    }
    return;
  }
  
  await createNotification({
    recipient: notificationData.recipient,
    sender: actor._id,
    type: notificationData.type,
    title: notificationData.title,
    message: notificationData.message,
    link: `/content/${content._id}`,
    metadata: { contentId: content._id }
  });
};

module.exports = { createNotification, notifyContentStatusChange };