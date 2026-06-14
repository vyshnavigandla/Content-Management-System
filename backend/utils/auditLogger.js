// utils/auditLogger.js
// Small helper to record an audit log entry. Wrapped in try/catch so
// that if logging fails for some reason, it never breaks the main
// request (e.g. approving content should still succeed even if the
// audit write has an issue).

const AuditLog = require('../models/AuditLog');

const logAction = async ({ user, action, targetId, targetType = 'content', remarks = '' }) => {
  try {
    await AuditLog.create({ user, action, targetId, targetType, remarks });
  } catch (error) {
    console.error('Audit log failed:', error.message);
  }
};

module.exports = logAction;