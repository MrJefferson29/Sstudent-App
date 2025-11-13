const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const controller = require('../controllers/studyGroupController');

// Public: get default group (no auth needed to join/read public room)
router.get('/default', controller.getDefaultGroup);

// Public: get messages for a group
router.get('/:groupId/messages', controller.getMessages);

// Protected: post a new message (optional REST fallback)
router.post('/:groupId/messages', protect, controller.postMessage);

// Public fallback: allow posting without auth for open study group
router.post('/:groupId/messages/public', controller.postMessage);

module.exports = router;