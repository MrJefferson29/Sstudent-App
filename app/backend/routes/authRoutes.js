const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const {
  getProfile,
  updateProfile,
  updatePassword,
  getUserStats,
  completeProfile,
} = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const { uploadSingle } = require('../middleware/imageUpload');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);

// Profile routes
router.get('/profile', protect, getProfile);
router.post('/profile/complete', protect, completeProfile);
router.put('/profile', protect, uploadSingle, updateProfile);
router.put('/profile/password', protect, updatePassword);
router.get('/profile/stats', protect, getUserStats);

module.exports = router;

