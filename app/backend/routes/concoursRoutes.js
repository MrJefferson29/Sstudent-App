const express = require('express');
const router = express.Router();
const {
  uploadConcours,
  getAllConcours,
  getConcoursById,
  updateConcours,
  deleteConcours,
} = require('../controllers/concoursController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getAllConcours);
router.get('/:id', getConcoursById);

// Protected admin routes
router.post('/', protect, upload.single('pdf'), uploadConcours);
router.put('/:id', protect, upload.single('pdf'), updateConcours);
router.delete('/:id', protect, deleteConcours);

module.exports = router;

