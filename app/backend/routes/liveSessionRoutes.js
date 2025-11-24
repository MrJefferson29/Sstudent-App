const express = require('express');
const router = express.Router();
const {
  createLiveSession,
  getLiveSessions,
  getLiveSessionById,
  updateLiveSession,
  startLiveSession,
  endLiveSession,
  deleteLiveSession,
} = require('../controllers/liveSessionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getLiveSessions)
  .post(createLiveSession);

router.route('/:id')
  .get(getLiveSessionById)
  .put(updateLiveSession)
  .delete(deleteLiveSession);

router.patch('/:id/start', startLiveSession);
router.patch('/:id/end', endLiveSession);

module.exports = router;


