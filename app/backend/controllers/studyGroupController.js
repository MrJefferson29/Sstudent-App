const StudyGroup = require('../models/StudyGroup');
const GroupMessage = require('../models/GroupMessage');

// Ensure default group exists and return it
exports.getDefaultGroup = async (req, res) => {
  try {
    let group = await StudyGroup.findOne({ name: 'General Study Group' });
    if (!group) {
      group = await StudyGroup.create({ name: 'General Study Group', description: 'Default room for all students.' });
    }
    res.json({ success: true, groupId: group._id.toString(), name: group.name });
  } catch (err) {
    console.error('getDefaultGroup error:', err);
    res.status(500).json({ success: false, message: 'Failed to get default group' });
  }
};

// Get recent messages for a group
exports.getMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const messages = await GroupMessage.find({ group: groupId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    console.error('getMessages error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

// Post a message via REST (fallback)
exports.postMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text } = req.body;
    const username = req.body.username || 'Anonymous';
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text required' });
    }
    const msg = await GroupMessage.create({
      group: groupId,
      user: req.userId || null,
      username,
      text: text.trim(),
    });
    res.status(201).json({ success: true, message: { id: msg._id, user: msg.username, text: msg.text, timestamp: msg.createdAt } });
  } catch (err) {
    console.error('postMessage error:', err);
    res.status(500).json({ success: false, message: 'Failed to post message' });
  }
};