const dashboardService = require('../services/dashboardService');

async function getDashboard(req, res, next) {
  try {
    const data = await dashboardService.getDashboardData(req.user, req.query);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard };
