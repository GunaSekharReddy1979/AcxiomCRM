const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { customerValidation } = require('../validators/customerValidator');
const { validateRequest } = require('../middleware/validateMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomerById);
router.post('/', customerValidation, validateRequest, customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
