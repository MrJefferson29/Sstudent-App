const express = require('express');
const router = express.Router();
const { getMessages, createMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:resourceType/:resourceId', getMessages);
router.post('/', protect, createMessage);

module.exports = router;


