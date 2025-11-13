const express = require('express');
const router = express.Router();
const {
  uploadSolution,
  getAllSolutions,
  getSolutionById,
  deleteSolution,
} = require('../controllers/solutionController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getAllSolutions);
router.get('/:id', getSolutionById);

// Protected routes (require authentication)
router.post('/', protect, upload.single('pdf'), uploadSolution);
router.delete('/:id', protect, deleteSolution);

module.exports = router;

