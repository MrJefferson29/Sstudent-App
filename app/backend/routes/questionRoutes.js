const express = require('express');
const router = express.Router();
const {
  uploadQuestion,
  getAllQuestions,
  getQuestionById,
  deleteQuestion,
  getSubjects,
} = require('../controllers/questionController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// Public routes
router.get('/subjects', getSubjects); // Get unique subjects - must be before /:id route
router.get('/', getAllQuestions);
router.get('/:id', getQuestionById);

// Protected routes (require authentication)
router.post('/', protect, upload.single('pdf'), uploadQuestion);
router.delete('/:id', protect, deleteQuestion);

module.exports = router;

