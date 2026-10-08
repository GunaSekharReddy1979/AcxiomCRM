const { Op } = require('sequelize');
const { Opportunity, User, Customer, Lead, FollowUp, Activity } = require('../models');
const { logAudit } = require('../utils/auditLogger');

function applyOpportunityScope(user) {
  if (user.roleName === 'Admin' || user.roleName === 'Manager') {
    return {};
  }
  return { AssignedTo: user.userId };
}

async function getOpportunities(user, query = {}) {
  const { search, stage, status, assignedTo, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = query;

  const scope = applyOpportunityScope(user);
  const where = { ...scope };

  if (stage) where.Stage = stage;
  if (status) where.Status = status;
  if (assignedTo && (user.roleName === 'Admin' || user.roleName === 'Manager')) {
    where.AssignedTo = assignedTo;
  }

  if (search) {
    const s = `%${search.trim()}%`;
    where[Op.and] = where[Op.and] || [];
    where[Op.and].push({
      [Op.or]: [
        { OpportunityName: { [Op.like]: s } }
      ]
    });
  }

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const { count, rows } = await Opportunity.findAndCountAll({
    where,
    include: [
      { model: Customer, as: 'customer', attributes: ['CustomerId', 'CustomerName', 'Email'] },
      { model: Lead, as: 'lead', attributes: ['LeadId', 'LeadName', 'LeadCode'] },
      { model: User, as: 'assignedUser', attributes: ['UserId', 'Name', 'Email'] }
    ],
    order: [[sortBy, sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
    limit: parseInt(limit, 10),
    offset
  });

  // Attach weighted value (Amount * Probability / 100)
  const transformedRows = rows.map(opp => {
    const plain = opp.toJSON();
    plain.weightedValue = Math.round((plain.Amount * (plain.Probability || 0)) / 100 * 100) / 100;
    return plain;
  });

  return {
    total: count,
    page: parseInt(page, 10),
    totalPages: Math.ceil(count / parseInt(limit, 10)) || 1,
    opportunities: transformedRows
  };
}

async function getOpportunityById(user, oppId) {
  const opp = await Opportunity.findByPk(oppId, {
    include: [
      { model: Customer, as: 'customer' },
      { model: Lead, as: 'lead' },
      { model: User, as: 'assignedUser', attributes: ['UserId', 'Name', 'Email'] },
      { model: FollowUp, as: 'followUps' },
      { model: Activity, as: 'activities' }
    ]
  });

  if (!opp) {
    const error = new Error('Opportunity not found.');
    error.status = 404;
    error.isOperational = true;
    throw error;
  }

  if (user.roleName === 'Sales Executive' && opp.AssignedTo !== user.userId) {
    const error = new Error('Forbidden: You are not authorized to view this opportunity.');
    error.status = 403;
    error.isOperational = true;
    throw error;
  }

  const plain = opp.toJSON();
  plain.weightedValue = Math.round((plain.Amount * (plain.Probability || 0)) / 100 * 100) / 100;
  return plain;
}

async function createOpportunity(user, data, req) {
  const { opportunityName, customerId, leadId, amount, stage = 'Qualification', probability = 20, expectedCloseDate, notes, assignedTo } = data;

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    const error = new Error('Opportunity Amount must be greater than 0.');
    error.status = 400;
    error.isOperational = true;
    throw error;
  }

  const parsedProb = parseInt(probability, 10);
  if (isNaN(parsedProb) || parsedProb < 0 || parsedProb > 100) {
    const error = new Error('Probability must be between 0 and 100.');
    error.status = 400;
    error.isOperational = true;
    throw error;
  }

  // Active opportunity close date check
  if (stage !== 'Won' && stage !== 'Lost') {
    const targetDate = new Date(expectedCloseDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    if (targetDate < today) {
      const error = new Error('Expected Close Date cannot be in the past.');
      error.status = 400;
      error.isOperational = true;
      throw error;
    }
  }

  let status = 'Open';
  if (stage === 'Won') status = 'Won';
  if (stage === 'Lost') status = 'Lost';

  const assignedUserId = (user.roleName === 'Sales Executive') ? user.userId : (assignedTo || user.userId);

  const newOpp = await Opportunity.create({
    OpportunityName: opportunityName.trim(),
    CustomerId: customerId || null,
    LeadId: leadId || null,
    Amount: parsedAmount,
    Stage: stage,
    Probability: parsedProb,
    ExpectedCloseDate: expectedCloseDate,
    Status: status,
    Notes: notes || null,
    AssignedTo: assignedUserId
  });

  await logAudit({
    userId: user.userId,
    action: 'CREATE',
    entityName: 'Opportunity',
    recordId: newOpp.OpportunityId,
    oldValue: null,
    newValue: newOpp.toJSON(),
    req
  });

  return newOpp;
}

async function updateOpportunity(user, oppId, data, req) {
  const opp = await Opportunity.findByPk(oppId);
  if (!opp) {
    const error = new Error('Opportunity not found.');
    error.status = 404;
    error.isOperational = true;
    throw error;
  }

  if (user.roleName === 'Sales Executive' && opp.AssignedTo !== user.userId) {
    const error = new Error('Forbidden: You are not authorized to update this opportunity.');
    error.status = 403;
    error.isOperational = true;
    throw error;
  }

  const oldValues = opp.toJSON();

  if (data.opportunityName) opp.OpportunityName = data.opportunityName.trim();
  if (data.customerId !== undefined) opp.CustomerId = data.customerId || null;
  if (data.leadId !== undefined) opp.LeadId = data.leadId || null;

  if (data.amount !== undefined) {
    const parsedAmount = parseFloat(data.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      const error = new Error('Opportunity Amount must be greater than 0.');
      error.status = 400;
      error.isOperational = true;
      throw error;
    }
    opp.Amount = parsedAmount;
  }

  if (data.probability !== undefined) {
    const parsedProb = parseInt(data.probability, 10);
    if (isNaN(parsedProb) || parsedProb < 0 || parsedProb > 100) {
      const error = new Error('Probability must be between 0 and 100.');
      error.status = 400;
      error.isOperational = true;
      throw error;
    }
    opp.Probability = parsedProb;
  }

  if (data.expectedCloseDate) {
    const newStage = data.stage || opp.Stage;
    if (newStage !== 'Won' && newStage !== 'Lost') {
      const targetDate = new Date(data.expectedCloseDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);
      if (targetDate < today) {
        const error = new Error('Expected Close Date cannot be in the past.');
        error.status = 400;
        error.isOperational = true;
        throw error;
      }
    }
    opp.ExpectedCloseDate = data.expectedCloseDate;
  }

  if (data.stage) {
    opp.Stage = data.stage;
    if (data.stage === 'Won') {
      opp.Status = 'Won';
      opp.Probability = 100;
    } else if (data.stage === 'Lost') {
      opp.Status = 'Lost';
      opp.Probability = 0;
    } else {
      opp.Status = 'Open';
    }
  }

  if (data.notes !== undefined) opp.Notes = data.notes;
  if (data.assignedTo && (user.roleName === 'Admin' || user.roleName === 'Manager')) {
    opp.AssignedTo = data.assignedTo;
  }

  await opp.save();

  await logAudit({
    userId: user.userId,
    action: 'UPDATE',
    entityName: 'Opportunity',
    recordId: opp.OpportunityId,
    oldValue: oldValues,
    newValue: opp.toJSON(),
    req
  });

  return opp;
}

async function deleteOpportunity(user, oppId, req) {
  const opp = await Opportunity.findByPk(oppId);
  if (!opp) {
    const error = new Error('Opportunity not found.');
    error.status = 404;
    error.isOperational = true;
    throw error;
  }

  if (user.roleName === 'Sales Executive' && opp.AssignedTo !== user.userId) {
    const error = new Error('Forbidden: You are not authorized to delete this opportunity.');
    error.status = 403;
    error.isOperational = true;
    throw error;
  }

  const oldValues = opp.toJSON();
  await opp.destroy();

  await logAudit({
    userId: user.userId,
    action: 'DELETE',
    entityName: 'Opportunity',
    recordId: oppId,
    oldValue: oldValues,
    newValue: null,
    req
  });

  return { message: 'Opportunity deleted successfully.' };
}

module.exports = {
  getOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity
};
