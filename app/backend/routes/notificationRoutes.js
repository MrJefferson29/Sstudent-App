const express = require('express');
const router = express.Router();
const {
  createNotification,
  getAllNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure multer for image or video upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB limit (for videos)
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image or video files are allowed'), false);
    }
  },
});

// Public routes
router.get('/', getAllNotifications);
router.get('/:id', getNotificationById);

// Protected admin routes
router.post('/', protect, upload.single('media'), createNotification);
router.put('/:id', protect, upload.single('media'), updateNotification);
router.delete('/:id', protect, deleteNotification);

module.exports = router;

