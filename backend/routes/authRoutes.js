const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginValidation, registerValidation } = require('../validators/authValidator');
const { validateRequest } = require('../middleware/validateMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/login', loginValidation, validateRequest, authController.login);
router.post('/register', registerValidation, validateRequest, authController.register);
router.post('/logout', authenticateToken, authController.logout);
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
