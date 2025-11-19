const express = require('express');
const router = express.Router();
const {
  createChapter,
  getChaptersByCourse,
  getChapterById,
  updateChapter,
  deleteChapter,
} = require('../controllers/courseChapterController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/course/:courseId', getChaptersByCourse);
router.get('/:id', getChapterById);

// Protected admin routes
router.post('/', protect, createChapter);
router.put('/:id', protect, updateChapter);
router.delete('/:id', protect, deleteChapter);

module.exports = router;

