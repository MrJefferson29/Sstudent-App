const express = require('express');
const router = express.Router();
const LiveMessage = require('../models/LiveMessage');
const LiveSession = require('../models/LiveSession');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

const ensureLiveRoomAccess = async (req, room) => {
  if (!room.startsWith('live-session:')) {
    return { allowed: true };
  }

  const sessionId = room.replace('live-session:', '');
  const session = await LiveSession.findById(sessionId).select('department status');
  if (!session) {
    return { allowed: false, code: 404, message: 'Live session not found' };
  }
  const user = await User.findById(req.userId).select('role department');
  if (!user) {
    return { allowed: false, code: 401, message: 'User not found' };
  }
  if (
    user.role !== 'admin' &&
    (!user.department || user.department.toString() !== session.department.toString())
  ) {
    return { allowed: false, code: 403, message: 'You cannot access this live session' };
  }
  return { allowed: true };
};

// GET /live/:room/messages?limit=50
router.get('/:room/messages', async (req, res) => {
  try {
    const { room } = req.params;
    const access = await ensureLiveRoomAccess(req, room);
    if (!access.allowed) {
      return res.status(access.code).json({ success: false, message: access.message });
    }

    const limit = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);
    const messages = await LiveMessage.find({ room })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json(messages.reverse());
  } catch (err) {
    console.error('Live messages fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch live messages' });
  }
});

// POST /live/:room/messages
router.post('/:room/messages', async (req, res) => {
  try {
    const { room } = req.params;
    const access = await ensureLiveRoomAccess(req, room);
    if (!access.allowed) {
      return res.status(access.code).json({ success: false, message: access.message });
    }

    const { username, message } = req.body || {};
    if (!username || !message) {
      return res.status(400).json({ error: 'username and message are required' });
    }
    const saved = await LiveMessage.create({ room, username, message });
    res.status(201).json(saved);
  } catch (err) {
    console.error('Live message save error:', err);
    res.status(500).json({ error: 'Failed to save live message' });
  }
});

module.exports = router;

