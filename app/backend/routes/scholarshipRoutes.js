const express = require('express');
const router = express.Router();
const {
  uploadScholarship,
  getAllScholarships,
  getScholarshipById,
  updateScholarship,
  deleteScholarship,
  deleteScholarshipImage,
} = require('../controllers/scholarshipController');
const { protect } = require('../middleware/authMiddleware');
const { uploadSingle, uploadMultiple } = require('../middleware/imageUpload');

// Public routes
router.get('/', getAllScholarships);
router.get('/:id', getScholarshipById);

// Protected routes (require authentication)
router.post('/', protect, uploadMultiple, uploadScholarship);
router.put('/:id', protect, uploadMultiple, updateScholarship);
router.delete('/:id', protect, deleteScholarship);
router.delete('/:scholarshipId/image', protect, deleteScholarshipImage);

module.exports = router;

