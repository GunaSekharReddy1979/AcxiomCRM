const followUpService = require('../services/followUpService');

async function getFollowUps(req, res, next) {
  try {
    const result = await followUpService.getFollowUps(req.user, req.query);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function createFollowUp(req, res, next) {
  try {
    const followUp = await followUpService.createFollowUp(req.user, req.body, req);
    return res.status(201).json({
      success: true,
      message: 'Follow-Up scheduled successfully.',
      data: followUp
    });
  } catch (err) {
    next(err);
  }
}

async function completeFollowUp(req, res, next) {
  try {
    const { remarks } = req.body;
    const followUp = await followUpService.completeFollowUp(req.user, req.params.id, remarks, req);
    return res.status(200).json({
      success: true,
      message: 'Follow-Up marked as Completed.',
      data: followUp
    });
  } catch (err) {
    next(err);
  }
}

async function rescheduleFollowUp(req, res, next) {
  try {
    const { newDate, remarks } = req.body;
    const followUp = await followUpService.rescheduleFollowUp(req.user, req.params.id, newDate, remarks, req);
    return res.status(200).json({
      success: true,
      message: 'Follow-Up rescheduled successfully.',
      data: followUp
    });
  } catch (err) {
    next(err);
  }
}

async function cancelFollowUp(req, res, next) {
  try {
    const { remarks } = req.body;
    const followUp = await followUpService.cancelFollowUp(req.user, req.params.id, remarks, req);
    return res.status(200).json({
      success: true,
      message: 'Follow-Up cancelled.',
      data: followUp
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getFollowUps,
  createFollowUp,
  completeFollowUp,
  rescheduleFollowUp,
  cancelFollowUp
};
