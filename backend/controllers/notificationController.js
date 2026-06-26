// controllers/notificationController.js
const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const { limit = 20, page = 1, unreadOnly = false } = req.query;
  
  const filter = { recipient: req.user._id };
  if (unreadOnly === 'true') filter.read = false;
  
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate('sender', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit)),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user._id, read: false })
  ]);
  
  res.json({
    success: true,
    data: {
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      },
      unreadCount
    }
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { read: true, readAt: new Date() },
    { new: true }
  );
  
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  
  res.json({ success: true, data: notification });
});

// @desc    Mark all as read
// @route   PUT /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, read: false },
    { read: true, readAt: new Date() }
  );
  
  res.json({ success: true, message: 'All notifications marked as read' });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user._id
  });
  
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  
  res.json({ success: true, message: 'Notification deleted' });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};