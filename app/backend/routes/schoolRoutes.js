const express = require('express');
const router = express.Router();
const {
  createSchool,
  getAllSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
} = require('../controllers/schoolController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getAllSchools);
router.get('/:id', getSchoolById);

// Protected admin routes
router.post('/', protect, createSchool);
router.put('/:id', protect, updateSchool);
router.delete('/:id', protect, deleteSchool);

module.exports = router;

