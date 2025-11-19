const express = require('express');
const router = express.Router();
const {
  createComment,
  getCommentsByChapter,
  getCommentById,
  updateComment,
  deleteComment,
} = require('../controllers/courseCommentController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/chapter/:chapterId', getCommentsByChapter);
router.get('/:id', getCommentById);

// Protected routes (require authentication)
router.post('/', protect, createComment);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;

