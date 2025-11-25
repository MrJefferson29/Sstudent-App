const express = require('express');
const router = express.Router();
const {
  uploadQuestion,
  getAllQuestions,
  getQuestionById,
  deleteQuestion,
  getSubjects,
  fixAllQuestionPDFs,
  getSignedPdfUrl,
} = require('../controllers/questionController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// Public routes
router.get('/subjects', getSubjects); // Get unique subjects - must be before /:id route
router.get('/signed-url/:id', getSignedPdfUrl); // Get signed URL for a question PDF - must be before /:id route
router.get('/', getAllQuestions);
router.get('/:id', getQuestionById);

// Protected routes (require authentication)
router.post('/', protect, upload.single('pdf'), uploadQuestion);
router.delete('/:id', protect, deleteQuestion);

// Admin route to fix all PDF access modes
router.post('/fix-pdfs', protect, fixAllQuestionPDFs);

module.exports = router;

