const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(authenticateToken);

// Reports available to permitted roles
router.get('/customer', reportController.getCustomerReport);
router.get('/lead', reportController.getLeadReport);
router.get('/followup', reportController.getFollowUpReport);
router.get('/opportunity', reportController.getOpportunityReport);
router.get('/pipeline', reportController.getPipelineReport);
router.get('/conversion', reportController.getConversionReport);

// Admin & Manager restricted reports
router.get('/user-activity', authorizeRoles('Admin', 'Manager'), reportController.getUserActivityReport);
router.get('/audit', authorizeRoles('Admin', 'Manager'), reportController.getAuditReport);

module.exports = router;
