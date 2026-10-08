const { Op } = require('sequelize');
const { FollowUp, User, Customer, Lead } = require('../models');
const { logAudit } = require('../utils/auditLogger');

function applyFollowUpScope(user) {
  if (user.roleName === 'Admin' || user.roleName === 'Manager') {
    return {};
  }
  return { AssignedTo: user.userId };
}

async function getFollowUps(user, query = {}) {
  const { search, status, type, filterMode, assignedTo, page = 1, limit = 10, sortBy = 'FollowUpDate', sortOrder = 'ASC' } = query;

  const scope = applyFollowUpScope(user);
  const where = { ...scope };

  if (status) where.Status = status;
  if (type) where.FollowUpType = type;
  if (assignedTo && (user.roleName === 'Admin' || user.roleName === 'Manager')) {
    where.AssignedTo = assignedTo;
  }

  const now = new Date();

  // Upcoming vs Overdue quick filters
  if (filterMode === 'upcoming') {
    where.Status = 'Planned';
    where.FollowUpDate = { [Op.gte]: now };
  } else if (filterMode === 'overdue') {
    where.Status = 'Planned';
    where.FollowUpDate = { [Op.lt]: now };
  }

  if (search) {
    const s = `%${search.trim()}%`;
    where[Op.and] = where[Op.and] || [];
    where[Op.and].push({
      [Op.or]: [
        { Subject: { [Op.like]: s } },
        { Remarks: { [Op.like]: s } }
      ]
    });
  }

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const { count, rows } = await FollowUp.findAndCountAll({
    where,
    include: [
      { model: Customer, as: 'customer', attributes: ['CustomerId', 'CustomerName', 'Phone', 'Email'] },
      { model: Lead, as: 'lead', attributes: ['LeadId', 'LeadName', 'Phone', 'Email', 'LeadCode'] },
      { model: User, as: 'assignedUser', attributes: ['UserId', 'Name', 'Email'] }
    ],
    order: [[sortBy, sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC']],
    limit: parseInt(limit, 10),
    offset
  });

  return {
    total: count,
    page: parseInt(page, 10),
    totalPages: Math.ceil(count / parseInt(limit, 10)) || 1,
    followUps: rows
  };
}

async function createFollowUp(user, data, req) {
  const { subject, followUpDate, followUpType = 'Call', remarks, customerId, leadId, assignedTo } = data;

  const targetDate = new Date(followUpDate);
  const now = new Date();
  now.setMinutes(now.getMinutes() - 5); // 5 min grace for current minute
  if (targetDate < now) {
    const error = new Error('Follow-up date cannot be earlier than today.');
    error.status = 400;
    error.isOperational = true;
    throw error;
  }

  const assignedUserId = (user.roleName === 'Sales Executive') ? user.userId : (assignedTo || user.userId);

  const newFollowUp = await FollowUp.create({
    Subject: subject.trim(),
    FollowUpDate: targetDate,
    FollowUpType: followUpType,
    Remarks: remarks || null,
    CustomerId: customerId || null,
    LeadId: leadId || null,
    Status: 'Planned',
    AssignedTo: assignedUserId
  });

  await logAudit({
    userId: user.userId,
    action: 'CREATE',
    entityName: 'FollowUp',
    recordId: newFollowUp.FollowUpId,
    oldValue: null,
    newValue: newFollowUp.toJSON(),
    req
  });

  return newFollowUp;
}

async function completeFollowUp(user, followUpId, remarks, req) {
  const followUp = await FollowUp.findByPk(followUpId);
  if (!followUp) {
    const error = new Error('Follow-Up record not found.');
    error.status = 404;
    error.isOperational = true;
    throw error;
  }

  if (user.roleName === 'Sales Executive' && followUp.AssignedTo !== user.userId) {
    const error = new Error('Forbidden: You are not authorized to complete this follow-up.');
    error.status = 403;
    error.isOperational = true;
    throw error;
  }

  const oldValues = followUp.toJSON();
  followUp.Status = 'Completed';
  followUp.CompletedAt = new Date();
  if (remarks) {
    followUp.Remarks = followUp.Remarks ? `${followUp.Remarks}\n[Completion Note]: ${remarks}` : remarks;
  }
  await followUp.save();

  await logAudit({
    userId: user.userId,
    action: 'COMPLETE_FOLLOWUP',
    entityName: 'FollowUp',
    recordId: followUp.FollowUpId,
    oldValue: oldValues,
    newValue: followUp.toJSON(),
    req
  });

  return followUp;
}

async function rescheduleFollowUp(user, followUpId, newDate, remarks, req) {
  const followUp = await FollowUp.findByPk(followUpId);
  if (!followUp) {
    const error = new Error('Follow-Up record not found.');
    error.status = 404;
    error.isOperational = true;
    throw error;
  }

  if (user.roleName === 'Sales Executive' && followUp.AssignedTo !== user.userId) {
    const error = new Error('Forbidden: You are not authorized to reschedule this follow-up.');
    error.status = 403;
    error.isOperational = true;
    throw error;
  }

  const targetDate = new Date(newDate);
  const now = new Date();
  now.setMinutes(now.getMinutes() - 5);
  if (targetDate < now) {
    const error = new Error('Follow-up date cannot be earlier than today.');
    error.status = 400;
    error.isOperational = true;
    throw error;
  }

  const oldValues = followUp.toJSON();
  followUp.FollowUpDate = targetDate;
  followUp.Status = 'Planned';
  if (remarks) {
    followUp.Remarks = followUp.Remarks ? `${followUp.Remarks}\n[Rescheduled]: ${remarks}` : remarks;
  }
  await followUp.save();

  await logAudit({
    userId: user.userId,
    action: 'RESCHEDULE_FOLLOWUP',
    entityName: 'FollowUp',
    recordId: followUp.FollowUpId,
    oldValue: oldValues,
    newValue: followUp.toJSON(),
    req
  });

  return followUp;
}

async function cancelFollowUp(user, followUpId, remarks, req) {
  const followUp = await FollowUp.findByPk(followUpId);
  if (!followUp) {
    const error = new Error('Follow-Up record not found.');
    error.status = 404;
    error.isOperational = true;
    throw error;
  }

  if (user.roleName === 'Sales Executive' && followUp.AssignedTo !== user.userId) {
    const error = new Error('Forbidden: You are not authorized to cancel this follow-up.');
    error.status = 403;
    error.isOperational = true;
    throw error;
  }

  const oldValues = followUp.toJSON();
  followUp.Status = 'Cancelled';
  if (remarks) {
    followUp.Remarks = followUp.Remarks ? `${followUp.Remarks}\n[Cancelled]: ${remarks}` : remarks;
  }
  await followUp.save();

  await logAudit({
    userId: user.userId,
    action: 'CANCEL_FOLLOWUP',
    entityName: 'FollowUp',
    recordId: followUp.FollowUpId,
    oldValue: oldValues,
    newValue: followUp.toJSON(),
    req
  });

  return followUp;
}

module.exports = {
  getFollowUps,
  createFollowUp,
  completeFollowUp,
  rescheduleFollowUp,
  cancelFollowUp
};
