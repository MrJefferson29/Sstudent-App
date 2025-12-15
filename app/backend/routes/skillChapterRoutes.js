const express = require('express');
const router = express.Router();
const {
  createChapter,
  getChaptersBySkill,
  getChapterById,
  updateChapter,
  deleteChapter,
} = require('../controllers/skillChapterController');
const { protect } = require('../middleware/authMiddleware');

router.get('/skill/:skillId', getChaptersBySkill);
router.get('/:id', getChapterById);
router.post('/', protect, createChapter);
router.put('/:id', protect, updateChapter);
router.delete('/:id', protect, deleteChapter);

module.exports = router;

