const { Op } = require('sequelize');
const { Lead, User, Customer, Opportunity, FollowUp, Activity } = require('../models');
const { logAudit } = require('../utils/auditLogger');

function applyLeadScope(user) {
  if (user.roleName === 'Admin' || user.roleName === 'Manager') {
    return {};
  }
  return { AssignedTo: user.userId };
}

async function getLeads(user, query = {}) {
  const { search, status, priority, assignedTo, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = query;

  const scope = applyLeadScope(user);
  const where = { ...scope };

  if (status) {
    where.Status = status;
  }
  if (priority) {
    where.Priority = priority;
  }
  if (assignedTo && (user.roleName === 'Admin' || user.roleName === 'Manager')) {
    where.AssignedTo = assignedTo;
  }

  if (search) {
    const s = `%${search.trim()}%`;
    where[Op.and] = where[Op.and] || [];
    where[Op.and].push({
      [Op.or]: [
        { LeadName: { [Op.like]: s } },
        { Email: { [Op.like]: s } },
        { Phone: { [Op.like]: s } },
        { CompanyName: { [Op.like]: s } },
        { LeadCode: { [Op.like]: s } }
      ]
    });
  }

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const { count, rows } = await Lead.findAndCountAll({
    where,
    include: [
      { model: User, as: 'assignedUser', attributes: ['UserId', 'Name', 'Email'] },
      { model: Customer, as: 'convertedCustomer', attributes: ['CustomerId', 'CustomerName', 'CustomerCode'] },
      { model: Opportunity, as: 'convertedOpportunity', attributes: ['OpportunityId', 'OpportunityName', 'Amount'] }
    ],
    order: [[sortBy, sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
    limit: parseInt(limit, 10),
    offset
  });

  return {
    total: count,
    page: parseInt(page, 10),
    totalPages: Math.ceil(count / parseInt(limit, 10)) || 1,
    leads: rows
  };
}

async function getLeadById(user, leadId) {
  const lead = await Lead.findByPk(leadId, {
    include: [
      { model: User, as: 'assignedUser', attributes: ['UserId', 'Name', 'Email'] },
      { model: Customer, as: 'convertedCustomer' },
      { model: Opportunity, as: 'convertedOpportunity' },
      { model: FollowUp, as: 'followUps' },
      { model: Activity, as: 'activities' }
    ]
  });

  if (!lead) {
    const error = new Error('Lead not found.');
    error.status = 404;
    error.isOperational = true;
    throw error;
  }

  if (user.roleName === 'Sales Executive' && lead.AssignedTo !== user.userId) {
    const error = new Error('Forbidden: You are not authorized to view this lead.');
    error.status = 403;
    error.isOperational = true;
    throw error;
  }

  return lead;
}

async function createLead(user, data, req) {
  const { leadName, email, phone, companyName, source = 'Website', status = 'New', priority = 'Medium', expectedValue = 0, notes, assignedTo } = data;

  const lastLead = await Lead.findOne({ order: [['LeadId', 'DESC']] });
  const nextNum = (lastLead?.LeadId || 0) + 1001;
  const leadCode = `LEAD-${nextNum}`;

  const assignedUserId = (user.roleName === 'Sales Executive') ? user.userId : (assignedTo || user.userId);

  const newLead = await Lead.create({
    LeadCode: leadCode,
    LeadName: leadName.trim(),
    Email: email.toLowerCase().trim(),
    Phone: phone.trim(),
    CompanyName: companyName ? companyName.trim() : null,
    Source: source,
    Status: status,
    Priority: priority,
    ExpectedValue: parseFloat(expectedValue) || 0,
    Notes: notes || null,
    AssignedTo: assignedUserId
  });

  await logAudit({
    userId: user.userId,
    action: 'CREATE',
    entityName: 'Lead',
    recordId: newLead.LeadId,
    oldValue: null,
    newValue: newLead.toJSON(),
    req
  });

  return newLead;
}

async function updateLead(user, leadId, data, req) {
  const lead = await Lead.findByPk(leadId);
  if (!lead) {
    const error = new Error('Lead not found.');
    error.status = 404;
    error.isOperational = true;
    throw error;
  }

  if (user.roleName === 'Sales Executive' && lead.AssignedTo !== user.userId) {
    const error = new Error('Forbidden: You are not authorized to update this lead.');
    error.status = 403;
    error.isOperational = true;
    throw error;
  }

  // Prevent invalid status transitions:
  // Once Converted, lead status cannot be reverted to New or Contacted
  if (lead.Status === 'Converted' && data.status && data.status !== 'Converted') {
    const error = new Error('A Converted lead cannot be transitioned back to prior workflow stages.');
    error.status = 400;
    error.isOperational = true;
    throw error;
  }

  const oldValues = lead.toJSON();

  if (data.leadName) lead.LeadName = data.leadName.trim();
  if (data.email) lead.Email = data.email.toLowerCase().trim();
  if (data.phone) lead.Phone = data.phone.trim();
  if (data.companyName !== undefined) lead.CompanyName = data.companyName ? data.companyName.trim() : null;
  if (data.source) lead.Source = data.source;
  if (data.status) lead.Status = data.status;
  if (data.priority) lead.Priority = data.priority;
  if (data.expectedValue !== undefined) lead.ExpectedValue = parseFloat(data.expectedValue) || 0;
  if (data.notes !== undefined) lead.Notes = data.notes;

  if (data.assignedTo && (user.roleName === 'Admin' || user.roleName === 'Manager')) {
    lead.AssignedTo = data.assignedTo;
  }

  await lead.save();

  await logAudit({
    userId: user.userId,
    action: 'UPDATE',
    entityName: 'Lead',
    recordId: lead.LeadId,
    oldValue: oldValues,
    newValue: lead.toJSON(),
    req
  });

  return lead;
}

async function deleteLead(user, leadId, req) {
  const lead = await Lead.findByPk(leadId);
  if (!lead) {
    const error = new Error('Lead not found.');
    error.status = 404;
    error.isOperational = true;
    throw error;
  }

  if (user.roleName === 'Sales Executive' && lead.AssignedTo !== user.userId) {
    const error = new Error('Forbidden: You are not authorized to delete this lead.');
    error.status = 403;
    error.isOperational = true;
    throw error;
  }

  const oldValues = lead.toJSON();
  await lead.destroy();

  await logAudit({
    userId: user.userId,
    action: 'DELETE',
    entityName: 'Lead',
    recordId: leadId,
    oldValue: oldValues,
    newValue: null,
    req
  });

  return { message: 'Lead deleted successfully.' };
}

/**
 * Lead Conversion Workflow:
 * Converts Lead -> Customer -> (Optional) Opportunity
 * Enforces audit trail and state update
 */
async function convertLead(user, leadId, conversionData, req) {
  const lead = await Lead.findByPk(leadId);
  if (!lead) {
    const error = new Error('Lead not found.');
    error.status = 404;
    error.isOperational = true;
    throw error;
  }

  if (user.roleName === 'Sales Executive' && lead.AssignedTo !== user.userId) {
    const error = new Error('Forbidden: You are not authorized to convert this lead.');
    error.status = 403;
    error.isOperational = true;
    throw error;
  }

  if (lead.Status === 'Converted') {
    const error = new Error('This lead has already been converted.');
    error.status = 400;
    error.isOperational = true;
    throw error;
  }

  // 1. Check or Create Customer
  let customer = await Customer.findOne({ where: { Email: lead.Email } });
  if (!customer) {
    const lastCustomer = await Customer.findOne({ order: [['CustomerId', 'DESC']] });
    const nextNum = (lastCustomer?.CustomerId || 0) + 1001;
    const customerCode = `CUST-${nextNum}`;

    customer = await Customer.create({
      CustomerCode: customerCode,
      CustomerName: conversionData.customerName || lead.LeadName,
      Email: lead.Email,
      Phone: lead.Phone,
      CompanyName: lead.CompanyName || null,
      Address: conversionData.address || null,
      City: conversionData.city || null,
      State: conversionData.state || null,
      Status: 'Active',
      CreatedBy: lead.AssignedTo || user.userId,
      Notes: `Converted from Lead ${lead.LeadCode} (${lead.LeadName})`
    });

    await logAudit({
      userId: user.userId,
      action: 'CREATE',
      entityName: 'Customer',
      recordId: customer.CustomerId,
      oldValue: null,
      newValue: customer.toJSON(),
      req
    });
  }

  // 2. Optionally create Opportunity
  let opportunity = null;
  if (conversionData.createOpportunity) {
    const amount = parseFloat(conversionData.opportunityAmount || lead.ExpectedValue) || 10000;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const closeDate = conversionData.expectedCloseDate || futureDate.toISOString().split('T')[0];

    opportunity = await Opportunity.create({
      OpportunityName: conversionData.opportunityName || `${customer.CustomerName} - Deal`,
      CustomerId: customer.CustomerId,
      LeadId: lead.LeadId,
      Amount: amount,
      Stage: conversionData.stage || 'Qualification',
      Probability: parseInt(conversionData.probability, 10) || 30,
      ExpectedCloseDate: closeDate,
      Status: 'Open',
      AssignedTo: lead.AssignedTo || user.userId,
      Notes: `Generated via conversion of Lead ${lead.LeadCode}`
    });

    await logAudit({
      userId: user.userId,
      action: 'CREATE',
      entityName: 'Opportunity',
      recordId: opportunity.OpportunityId,
      oldValue: null,
      newValue: opportunity.toJSON(),
      req
    });
  }

  // 3. Update Lead Status
  const oldLeadSnapshot = lead.toJSON();
  lead.Status = 'Converted';
  lead.ConvertedCustomerId = customer.CustomerId;
  if (opportunity) {
    lead.ConvertedOpportunityId = opportunity.OpportunityId;
  }
  await lead.save();

  // 4. Log conversion event
  await logAudit({
    userId: user.userId,
    action: 'LEAD_CONVERSION',
    entityName: 'Lead',
    recordId: lead.LeadId,
    oldValue: oldLeadSnapshot,
    newValue: {
      leadId: lead.LeadId,
      customerId: customer.CustomerId,
      opportunityId: opportunity?.OpportunityId || null,
      status: 'Converted'
    },
    req
  });

  return {
    lead,
    customer,
    opportunity
  };
}

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  convertLead
};
