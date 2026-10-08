const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { leadValidation } = require('../validators/leadValidator');
const { validateRequest } = require('../middleware/validateMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', leadController.getLeads);
router.get('/:id', leadController.getLeadById);
router.post('/', leadValidation, validateRequest, leadController.createLead);
router.put('/:id', leadController.updateLead);
router.delete('/:id', leadController.deleteLead);
router.post('/:id/convert', leadController.convertLead);

module.exports = router;
