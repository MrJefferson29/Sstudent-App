const express = require('express');
const router = express.Router();
const {
  createSkill,
  getAllSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
} = require('../controllers/skillController');
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
router.get('/', getAllSkills);
router.get('/:id', getSkillById);

// Protected admin routes
router.post('/', protect, uploadSingle.single('thumbnail'), createSkill);
router.put('/:id', protect, uploadSingle.single('thumbnail'), updateSkill);
router.delete('/:id', protect, deleteSkill);

module.exports = router;


