const { Op, fn, col } = require('sequelize');
const { Customer, Lead, Opportunity, FollowUp, Activity, User, AuditLog } = require('../models');

function getScope(user) {
  if (user.roleName === 'Admin' || user.roleName === 'Manager') {
    return { isScoped: false, userId: null };
  }
  return { isScoped: true, userId: user.userId };
}

async function getCustomerReport(user, filters = {}) {
  const scope = getScope(user);
  const where = scope.isScoped ? { CreatedBy: scope.userId } : {};
  if (filters.status) where.Status = filters.status;
  if (filters.city) where.City = { [Op.like]: `%${filters.city}%` };

  return await Customer.findAll({
    where,
    include: [{ model: User, as: 'owner', attributes: ['UserId', 'Name', 'Email'] }],
    order: [['createdAt', 'DESC']]
  });
}

async function getLeadReport(user, filters = {}) {
  const scope = getScope(user);
  const where = scope.isScoped ? { AssignedTo: scope.userId } : {};
  if (filters.status) where.Status = filters.status;
  if (filters.source) where.Source = filters.source;

  return await Lead.findAll({
    where,
    include: [
      { model: User, as: 'assignedUser', attributes: ['UserId', 'Name', 'Email'] },
      { model: Customer, as: 'convertedCustomer', attributes: ['CustomerId', 'CustomerName'] },
      { model: Opportunity, as: 'convertedOpportunity', attributes: ['OpportunityId', 'OpportunityName'] }
    ],
    order: [['createdAt', 'DESC']]
  });
}

async function getFollowUpReport(user, filters = {}) {
  const scope = getScope(user);
  const where = scope.isScoped ? { AssignedTo: scope.userId } : {};
  if (filters.status) where.Status = filters.status;
  if (filters.type) where.FollowUpType = filters.type;

  const now = new Date();
  const followUps = await FollowUp.findAll({
    where,
    include: [
      { model: Customer, as: 'customer', attributes: ['CustomerId', 'CustomerName'] },
      { model: Lead, as: 'lead', attributes: ['LeadId', 'LeadName'] },
      { model: User, as: 'assignedUser', attributes: ['UserId', 'Name'] }
    ],
    order: [['FollowUpDate', 'DESC']]
  });

  return followUps.map(f => {
    const item = f.toJSON();
    item.isOverdue = item.Status === 'Planned' && new Date(item.FollowUpDate) < now;
    return item;
  });
}

async function getOpportunityReport(user, filters = {}) {
  const scope = getScope(user);
  const where = scope.isScoped ? { AssignedTo: scope.userId } : {};
  if (filters.stage) where.Stage = filters.stage;
  if (filters.status) where.Status = filters.status;

  const opps = await Opportunity.findAll({
    where,
    include: [
      { model: Customer, as: 'customer', attributes: ['CustomerId', 'CustomerName'] },
      { model: User, as: 'assignedUser', attributes: ['UserId', 'Name'] }
    ],
    order: [['ExpectedCloseDate', 'ASC']]
  });

  return opps.map(o => {
    const item = o.toJSON();
    item.weightedValue = Math.round((item.Amount * item.Probability) / 100 * 100) / 100;
    return item;
  });
}

async function getPipelineReport(user) {
  const scope = getScope(user);
  const where = scope.isScoped ? { AssignedTo: scope.userId } : {};

  const opps = await Opportunity.findAll({
    where: { ...where, Status: 'Open' },
    include: [
      { model: User, as: 'assignedUser', attributes: ['UserId', 'Name'] },
      { model: Customer, as: 'customer', attributes: ['CustomerId', 'CustomerName'] }
    ]
  });

  // Aggregate by stage
  const stageSummary = {};
  const ownerSummary = {};

  opps.forEach(opp => {
    const stage = opp.Stage;
    const ownerName = opp.assignedUser ? opp.assignedUser.Name : 'Unassigned';
    const amount = parseFloat(opp.Amount) || 0;
    const weighted = Math.round((amount * (opp.Probability || 0)) / 100 * 100) / 100;

    if (!stageSummary[stage]) stageSummary[stage] = { count: 0, totalAmount: 0, weightedAmount: 0 };
    stageSummary[stage].count += 1;
    stageSummary[stage].totalAmount += amount;
    stageSummary[stage].weightedAmount += weighted;

    if (!ownerSummary[ownerName]) ownerSummary[ownerName] = { count: 0, totalAmount: 0, weightedAmount: 0 };
    ownerSummary[ownerName].count += 1;
    ownerSummary[ownerName].totalAmount += amount;
    ownerSummary[ownerName].weightedAmount += weighted;
  });

  return {
    stageSummary,
    ownerSummary,
    opportunities: opps.map(o => ({
      ...o.toJSON(),
      weightedValue: Math.round((o.Amount * o.Probability) / 100 * 100) / 100
    }))
  };
}

async function getConversionReport(user) {
  const scope = getScope(user);
  const leadWhere = scope.isScoped ? { AssignedTo: scope.userId } : {};
  const oppWhere = scope.isScoped ? { AssignedTo: scope.userId } : {};

  const totalLeads = await Lead.count({ where: leadWhere });
  const convertedLeads = await Lead.count({ where: { ...leadWhere, Status: 'Converted' } });
  const lostLeads = await Lead.count({ where: { ...leadWhere, Status: 'Lost' } });
  const openLeads = totalLeads - convertedLeads - lostLeads;

  const totalOpps = await Opportunity.count({ where: oppWhere });
  const wonOpps = await Opportunity.count({ where: { ...oppWhere, Status: 'Won' } });
  const lostOpps = await Opportunity.count({ where: { ...oppWhere, Status: 'Lost' } });
  const openOpps = totalOpps - wonOpps - lostOpps;

  const leadConversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 1000) / 10 : 0;
  const oppWinRate = totalOpps > 0 ? Math.round((wonOpps / totalOpps) * 1000) / 10 : 0;

  return {
    leads: {
      total: totalLeads,
      converted: convertedLeads,
      lost: lostLeads,
      open: openLeads,
      conversionRate: leadConversionRate
    },
    opportunities: {
      total: totalOpps,
      won: wonOpps,
      lost: lostOpps,
      open: openOpps,
      winRate: oppWinRate
    }
  };
}

async function getUserActivityReport(user) {
  if (user.roleName === 'Sales Executive') {
    const error = new Error('Forbidden: Sales Executive does not have permission to view team activity reports.');
    error.status = 403;
    error.isOperational = true;
    throw error;
  }

  const users = await User.findAll({
    attributes: ['UserId', 'Name', 'Email', 'Department', 'IsActive'],
    include: [
      { model: Activity, as: 'activities', attributes: ['ActivityId', 'ActivityType', 'ActivityDate'] },
      { model: FollowUp, as: 'followUps', attributes: ['FollowUpId', 'Status'] },
      { model: Lead, as: 'leads', attributes: ['LeadId', 'Status'] },
      { model: Opportunity, as: 'opportunities', attributes: ['OpportunityId', 'Status', 'Amount'] }
    ]
  });

  return users.map(u => {
    const plain = u.toJSON();
    return {
      userId: plain.UserId,
      name: plain.Name,
      email: plain.Email,
      department: plain.Department,
      isActive: plain.IsActive,
      activityCount: plain.activities?.length || 0,
      followUpCount: plain.followUps?.length || 0,
      leadCount: plain.leads?.length || 0,
      opportunityCount: plain.opportunities?.length || 0,
      wonDealsCount: plain.opportunities?.filter(o => o.Status === 'Won').length || 0
    };
  });
}

async function getAuditReport(user, query = {}) {
  if (user.roleName !== 'Admin' && user.roleName !== 'Manager') {
    const error = new Error('Forbidden: Only administrators and managers may view audit reports.');
    error.status = 403;
    error.isOperational = true;
    throw error;
  }

  const { module, action, userId, startDate, endDate, page = 1, limit = 20 } = query;
  const where = {};

  if (module) where.EntityName = module;
  if (action) where.Action = action;
  if (userId) where.UserId = userId;

  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    e.setHours(23, 59, 59, 999);
    where.CreatedDate = { [Op.between]: [s, e] };
  }

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const { count, rows } = await AuditLog.findAndCountAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['UserId', 'Name', 'Email'] }],
    order: [['CreatedDate', 'DESC']],
    limit: parseInt(limit, 10),
    offset
  });

  return {
    total: count,
    page: parseInt(page, 10),
    totalPages: Math.ceil(count / parseInt(limit, 10)) || 1,
    auditLogs: rows
  };
}

module.exports = {
  getCustomerReport,
  getLeadReport,
  getFollowUpReport,
  getOpportunityReport,
  getPipelineReport,
  getConversionReport,
  getUserActivityReport,
  getAuditReport
};
