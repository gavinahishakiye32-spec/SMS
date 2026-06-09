const express = require('express');
const router = express.Router();
const { login, logout, changePassword, resetPassword, updateProfile } = require('../controllers/authController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.post('/login', login);
router.post('/logout', protect, logout);
router.put('/change-password', protect, changePassword);
router.post('/reset-password', protect, authorizeRoles('superadmin', 'schooladmin'), resetPassword);
router.put('/profile', protect, updateProfile);

module.exports = router;
