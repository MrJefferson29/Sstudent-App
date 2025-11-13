const express = require('express');
const router = express.Router();
const {
  uploadInternship,
  getAllInternships,
  getInternshipById,
  updateInternship,
  deleteInternship,
} = require('../controllers/internshipController');
const { protect } = require('../middleware/authMiddleware');
const { uploadSingle } = require('../middleware/imageUpload');

// Public routes
router.get('/', getAllInternships);
router.get('/:id', getInternshipById);

// Protected routes (require authentication)
router.post('/', protect, uploadSingle, uploadInternship);
router.put('/:id', protect, uploadSingle, updateInternship);
router.delete('/:id', protect, deleteInternship);

module.exports = router;

