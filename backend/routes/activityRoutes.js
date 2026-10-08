const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { activityValidation } = require('../validators/activityValidator');
const { validateRequest } = require('../middleware/validateMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', activityController.getActivities);
router.post('/', activityValidation, validateRequest, activityController.createActivity);

module.exports = router;
