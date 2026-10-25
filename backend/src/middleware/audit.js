const AuditLog = require('../models/Auditlog');

const logAudit = async (actor, action, entity) => {
  try {
    await AuditLog.create({ actor, action, entity });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
};

module.exports = { logAudit };