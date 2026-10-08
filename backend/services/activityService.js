const { Op } = require('sequelize');
const { Activity, User, Customer, Lead } = require('../models');
const { logAudit } = require('../utils/auditLogger');

function applyActivityScope(user) {
  if (user.roleName === 'Admin' || user.roleName === 'Manager') {
    return {};
  }
  return { AssignedTo: user.userId };
}

async function getActivities(user, query = {}) {
  const { type, status, assignedTo, page = 1, limit = 10, sortBy = 'ActivityDate', sortOrder = 'DESC' } = query;

  const scope = applyActivityScope(user);
  const where = { ...scope };

  if (type) where.ActivityType = type;
  if (status) where.Status = status;
  if (assignedTo && (user.roleName === 'Admin' || user.roleName === 'Manager')) {
    where.AssignedTo = assignedTo;
  }

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const { count, rows } = await Activity.findAndCountAll({
    where,
    include: [
      { model: Customer, as: 'customer', attributes: ['CustomerId', 'CustomerName'] },
      { model: Lead, as: 'lead', attributes: ['LeadId', 'LeadName', 'LeadCode'] },
      { model: User, as: 'assignedUser', attributes: ['UserId', 'Name', 'Email'] }
    ],
    order: [[sortBy, sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
    limit: parseInt(limit, 10),
    offset
  });

  return {
    total: count,
    page: parseInt(page, 10),
    totalPages: Math.ceil(count / parseInt(limit, 10)) || 1,
    activities: rows
  };
}

async function createActivity(user, data, req) {
  const { activityType, subject, description, activityDate, customerId, leadId, assignedTo, status = 'Completed' } = data;

  const assignedUserId = (user.roleName === 'Sales Executive') ? user.userId : (assignedTo || user.userId);

  const newActivity = await Activity.create({
    ActivityType: activityType,
    Subject: subject.trim(),
    Description: description || null,
    ActivityDate: activityDate || new Date(),
    CustomerId: customerId || null,
    LeadId: leadId || null,
    AssignedTo: assignedUserId,
    Status: status
  });

  await logAudit({
    userId: user.userId,
    action: 'CREATE',
    entityName: 'Activity',
    recordId: newActivity.ActivityId,
    oldValue: null,
    newValue: newActivity.toJSON(),
    req
  });

  return newActivity;
}

module.exports = {
  getActivities,
  createActivity
};
