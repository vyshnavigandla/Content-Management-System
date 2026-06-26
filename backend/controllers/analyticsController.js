// controllers/analyticsController.js
// Fix: getUserAnalytics previously counted only users *created within the date
// window* but labelled it "total users" — misleading for the HOD dashboard.
// Now "total" = all users ever, and "newUsers" = created in the window.

const asyncHandler = require('express-async-handler');
const Content      = require('../models/Content');
const User         = require('../models/User');
const AuditLog     = require('../models/AuditLog');

// @desc    Get content analytics
// @route   GET /api/analytics/content
// @access  Private (HOD only)
const getContentAnalytics = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const dateFilter = new Date();
  dateFilter.setDate(dateFilter.getDate() - parseInt(days));

  const [
    totalContent,
    publishedContent,
    pendingApproval,
    rejectedContent,
    archivedContent,
    contentByType,
    topViewedContent,
    recentActivity,
  ] = await Promise.all([
    Content.countDocuments({ createdAt: { $gte: dateFilter } }),
    Content.countDocuments({ status: 'published', publishedAt: { $gte: dateFilter } }),
    Content.countDocuments({ status: 'pending_approval' }),
    Content.countDocuments({ status: 'rejected', updatedAt: { $gte: dateFilter } }),
    Content.countDocuments({ status: 'archived' }),
    Content.aggregate([
      { $match: { createdAt: { $gte: dateFilter } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Content.find({ status: 'published' })
      .sort({ viewCount: -1, downloadCount: -1 })
      .limit(5)
      .populate('createdBy', 'name email'),
    AuditLog.find({ createdAt: { $gte: dateFilter } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email'),
  ]);

  // Trend vs previous period
  const previousPeriodStart = new Date(dateFilter);
  previousPeriodStart.setDate(previousPeriodStart.getDate() - parseInt(days));
  const previousPeriodContent = await Content.countDocuments({
    createdAt: { $gte: previousPeriodStart, $lt: dateFilter },
  });
  const trend =
    previousPeriodContent > 0
      ? ((totalContent - previousPeriodContent) / previousPeriodContent * 100).toFixed(1)
      : 0;

  res.json({
    success: true,
    data: {
      overview: {
        totalContent,
        publishedContent,
        pendingApproval,
        rejectedContent,
        archivedContent,
        trend: parseFloat(trend),
      },
      contentByType,
      topViewedContent,
      recentActivity,
      timeframe: `${days} days`,
    },
  });
});

// @desc    Get user activity analytics
// @route   GET /api/analytics/users
// @access  Private (HOD only)
const getUserAnalytics = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const dateFilter = new Date();
  dateFilter.setDate(dateFilter.getDate() - parseInt(days));

  const [
    totalUsers,     // FIX: all users ever, not just within the window
    newUsers,       // NEW: users created within the window
    facultyCount,
    studentCount,
    activeUsers,
    topContributors,
    uploadActivity,
  ] = await Promise.all([
    User.countDocuments({}),                                        // total ever
    User.countDocuments({ createdAt: { $gte: dateFilter } }),       // new this period
    User.countDocuments({ role: 'faculty', isActive: true }),
    User.countDocuments({ role: 'student', isActive: true }),
    User.countDocuments({ isActive: true, updatedAt: { $gte: dateFilter } }),
    Content.aggregate([
      { $match: { createdAt: { $gte: dateFilter } } },
      { $group: { _id: '$createdBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from:         'users',
          localField:   '_id',
          foreignField: '_id',
          as:           'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id:        1,
          count:      1,
          'user.name':  1,
          'user.email': 1,
          'user.role':  1,
        },
      },
    ]),
    Content.aggregate([
      { $match: { createdAt: { $gte: dateFilter } } },
      {
        $group: {
          _id:   { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      users: {
        total:    totalUsers,   // all users ever
        newUsers,               // created in the selected window
        faculty:  facultyCount,
        students: studentCount,
        active:   activeUsers,
      },
      topContributors,
      uploadActivity,
      timeframe: `${days} days`,
    },
  });
});

module.exports = { getContentAnalytics, getUserAnalytics };