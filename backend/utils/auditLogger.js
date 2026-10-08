const { AuditLog } = require('../models');

/**
 * Creates an append-only audit log entry
 * @param {Object} params
 * @param {number|null} params.userId
 * @param {string} params.action - e.g. LOGIN, FAILED_LOGIN, CREATE, UPDATE, DELETE, etc.
 * @param {string} params.entityName - e.g. Customer, Lead, Opportunity, Auth, User
 * @param {string|number} [params.recordId]
 * @param {any} [params.oldValue]
 * @param {any} [params.newValue]
 * @param {Object} [params.req] - Express request object for IP resolution
 */
async function logAudit({ userId, action, entityName, recordId, oldValue, newValue, req }) {
  try {
    let ipAddress = '127.0.0.1';
    if (req) {
      ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
      if (typeof ipAddress === 'string' && ipAddress.includes(',')) {
        ipAddress = ipAddress.split(',')[0].trim();
      }
    }

    const oldStr = oldValue ? (typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue)) : null;
    const newStr = newValue ? (typeof newValue === 'string' ? newValue : JSON.stringify(newValue)) : null;

    await AuditLog.create({
      UserId: userId || null,
      Action: action,
      EntityName: entityName,
      RecordId: recordId ? String(recordId) : null,
      OldValue: oldStr,
      NewValue: newStr,
      IpAddress: ipAddress,
      CreatedDate: new Date()
    });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

module.exports = { logAudit };
