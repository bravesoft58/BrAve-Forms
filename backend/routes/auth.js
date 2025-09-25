const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Register a new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Verify MFA code
router.post('/verify-mfa', authController.verifyMfa);

// Get user profile
router.get('/profile', auth, authController.getProfile);

module.exports = router;