const opportunityService = require('../services/opportunityService');

async function getOpportunities(req, res, next) {
  try {
    const result = await opportunityService.getOpportunities(req.user, req.query);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function getOpportunityById(req, res, next) {
  try {
    const opp = await opportunityService.getOpportunityById(req.user, req.params.id);
    return res.status(200).json({
      success: true,
      data: opp
    });
  } catch (err) {
    next(err);
  }
}

async function createOpportunity(req, res, next) {
  try {
    const opp = await opportunityService.createOpportunity(req.user, req.body, req);
    return res.status(201).json({
      success: true,
      message: 'Opportunity created successfully.',
      data: opp
    });
  } catch (err) {
    next(err);
  }
}

async function updateOpportunity(req, res, next) {
  try {
    const opp = await opportunityService.updateOpportunity(req.user, req.params.id, req.body, req);
    return res.status(200).json({
      success: true,
      message: 'Opportunity updated successfully.',
      data: opp
    });
  } catch (err) {
    next(err);
  }
}

async function deleteOpportunity(req, res, next) {
  try {
    const result = await opportunityService.deleteOpportunity(req.user, req.params.id, req);
    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity
};
