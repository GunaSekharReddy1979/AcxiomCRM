const express = require('express');
const router = express.Router();
const opportunityController = require('../controllers/opportunityController');
const { opportunityValidation } = require('../validators/opportunityValidator');
const { validateRequest } = require('../middleware/validateMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', opportunityController.getOpportunities);
router.get('/:id', opportunityController.getOpportunityById);
router.post('/', opportunityValidation, validateRequest, opportunityController.createOpportunity);
router.put('/:id', opportunityController.updateOpportunity);
router.delete('/:id', opportunityController.deleteOpportunity);

module.exports = router;
