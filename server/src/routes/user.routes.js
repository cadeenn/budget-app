const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// GET /api/users/profile - Get user profile
router.get('/profile', userController.getProfile);

// PUT /api/users/profile - Update user profile
router.put('/profile', userController.updateProfile);

// PUT /api/users/change-password - Change user password
router.put('/change-password', userController.changePassword);

// DELETE /api/users/account - Delete user account
router.delete('/account', userController.deleteAccount);

module.exports = router; 