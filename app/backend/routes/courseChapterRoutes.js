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
const multer = require('multer');

// Configure multer for video upload
const storage = multer.memoryStorage();
const uploadVideo = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for videos
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  },
});

// Public routes
router.get('/course/:courseId', getChaptersByCourse);
router.get('/:id', getChapterById);

// Protected admin routes
router.post('/', protect, uploadVideo.single('video'), createChapter);
router.put('/:id', protect, uploadVideo.single('video'), updateChapter);
router.delete('/:id', protect, deleteChapter);

module.exports = router;

