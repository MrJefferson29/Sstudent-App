const express = require('express');
const router = express.Router();
const {
  uploadQuestion,
  getAllQuestions,
  getQuestionById,
  deleteQuestion,
} = require('../controllers/questionController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getAllQuestions);
router.get('/:id', getQuestionById);

// Protected routes (require authentication)
router.post('/', protect, upload.single('pdf'), uploadQuestion);
router.delete('/:id', protect, deleteQuestion);

module.exports = router;

