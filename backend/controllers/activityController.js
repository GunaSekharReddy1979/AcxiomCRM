const activityService = require('../services/activityService');

async function getActivities(req, res, next) {
  try {
    const result = await activityService.getActivities(req.user, req.query);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function createActivity(req, res, next) {
  try {
    const activity = await activityService.createActivity(req.user, req.body, req);
    return res.status(201).json({
      success: true,
      message: 'Activity recorded successfully.',
      data: activity
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getActivities,
  createActivity
};
