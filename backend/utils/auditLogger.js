// utils/auditLogger.js
const AuditLog = require('../models/AuditLog');

const logAction = async ({ user, action, targetId, targetType = 'content', remarks = '' }) => {
  try {
    await AuditLog.create({ user, action, targetId, targetType, remarks });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

module.exports = logAction;