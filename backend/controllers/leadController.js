const leadService = require('../services/leadService');

async function getLeads(req, res, next) {
  try {
    const result = await leadService.getLeads(req.user, req.query);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function getLeadById(req, res, next) {
  try {
    const lead = await leadService.getLeadById(req.user, req.params.id);
    return res.status(200).json({
      success: true,
      data: lead
    });
  } catch (err) {
    next(err);
  }
}

async function createLead(req, res, next) {
  try {
    const lead = await leadService.createLead(req.user, req.body, req);
    return res.status(201).json({
      success: true,
      message: 'Lead created successfully.',
      data: lead
    });
  } catch (err) {
    next(err);
  }
}

async function updateLead(req, res, next) {
  try {
    const lead = await leadService.updateLead(req.user, req.params.id, req.body, req);
    return res.status(200).json({
      success: true,
      message: 'Lead updated successfully.',
      data: lead
    });
  } catch (err) {
    next(err);
  }
}

async function deleteLead(req, res, next) {
  try {
    const result = await leadService.deleteLead(req.user, req.params.id, req);
    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
}

async function convertLead(req, res, next) {
  try {
    const result = await leadService.convertLead(req.user, req.params.id, req.body, req);
    return res.status(200).json({
      success: true,
      message: 'Lead successfully converted to Customer and Opportunity pipeline.',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  convertLead
};
