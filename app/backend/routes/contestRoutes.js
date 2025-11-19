const express = require('express');
const router = express.Router();
const {
  getContests,
  getContestants,
  createContest,
  addContestant,
  deleteContestant,
  getContestStats,
  seedDummyData,
  updateContest,
  deleteContest,
} = require('../controllers/contestController');
const { protect } = require('../middleware/authMiddleware');
const { uploadSingle } = require('../middleware/imageUpload');

// Public routes
router.get('/', getContests);
router.get('/:contestId/contestants', getContestants);
router.get('/:contestId/stats', getContestStats);

// Admin routes
router.post('/', protect, createContest);
router.put('/:contestId', protect, updateContest);
router.delete('/:contestId', protect, deleteContest);
router.post('/:contestId/contestants', protect, uploadSingle, addContestant);
router.delete('/contestants/:contestantId', protect, deleteContestant);
router.post('/seed-dummy', seedDummyData);

module.exports = router;