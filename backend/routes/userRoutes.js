const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { registerValidation } = require('../validators/authValidator');
const { validateRequest } = require('../middleware/validateMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// User administration is strictly Admin-only
router.use(authenticateToken);
router.use(authorizeRoles('Admin'));

router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.post('/', registerValidation, validateRequest, userController.createUser);
router.put('/:id', userController.updateUser);
router.post('/:id/unlock', userController.unlockUser);
router.post('/:id/toggle-status', userController.toggleStatus);

module.exports = router;
