const express = require('express');
const router = express.Router();
const followUpController = require('../controllers/followUpController');
const { followUpValidation } = require('../validators/followUpValidator');
const { validateRequest } = require('../middleware/validateMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', followUpController.getFollowUps);
router.post('/', followUpValidation, validateRequest, followUpController.createFollowUp);
router.post('/:id/complete', followUpController.completeFollowUp);
router.post('/:id/reschedule', followUpController.rescheduleFollowUp);
router.post('/:id/cancel', followUpController.cancelFollowUp);

module.exports = router;
