const express = require('express');
const router = express.Router();
const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure multer for image upload
const storage = multer.memoryStorage();
const uploadSingle = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Public routes
router.get('/', getAllCourses);
router.get('/:id', getCourseById);

// Protected admin routes
router.post('/', protect, uploadSingle.single('thumbnail'), createCourse);
router.put('/:id', protect, uploadSingle.single('thumbnail'), updateCourse);
router.delete('/:id', protect, deleteCourse);

module.exports = router;

