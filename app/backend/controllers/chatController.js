const ChatMessage = require('../models/ChatMessage');

exports.getMessages = async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    const limit = parseInt(req.query.limit || '100', 10);

    const messages = await ChatMessage.find({
      resourceType,
      resourceId,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: messages.reverse(),
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat messages',
      error: error.message,
    });
  }
};

exports.createMessage = async (req, res) => {
  try {
    const { resourceType, resourceId, room, text, isQuestion } = req.body;
    const userId = req.userId || null;
    const username = req.userName || req.body.username || 'Learner';

    if (!resourceType || !resourceId || !text?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'resourceType, resourceId and text are required',
      });
    }

    const message = await ChatMessage.create({
      resourceType,
      resourceId,
      room: room || `${resourceType}:${resourceId}`,
      user: userId,
      username,
      text: text.trim(),
      isQuestion: Boolean(isQuestion),
    });

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Create chat message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat message',
      error: error.message,
    });
  }
};


