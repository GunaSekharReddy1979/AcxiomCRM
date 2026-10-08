const reportService = require('../services/reportService');

async function getCustomerReport(req, res, next) {
  try {
    const data = await reportService.getCustomerReport(req.user, req.query);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getLeadReport(req, res, next) {
  try {
    const data = await reportService.getLeadReport(req.user, req.query);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getFollowUpReport(req, res, next) {
  try {
    const data = await reportService.getFollowUpReport(req.user, req.query);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getOpportunityReport(req, res, next) {
  try {
    const data = await reportService.getOpportunityReport(req.user, req.query);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getPipelineReport(req, res, next) {
  try {
    const data = await reportService.getPipelineReport(req.user);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getConversionReport(req, res, next) {
  try {
    const data = await reportService.getConversionReport(req.user);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getUserActivityReport(req, res, next) {
  try {
    const data = await reportService.getUserActivityReport(req.user);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getAuditReport(req, res, next) {
  try {
    const data = await reportService.getAuditReport(req.user, req.query);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
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
