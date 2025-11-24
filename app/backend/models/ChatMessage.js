const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  resourceType: {
    type: String,
    enum: ['course', 'video'],
    required: true,
  },
  resourceId: {
    type: String,
    required: true,
    trim: true,
  },
  room: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  username: {
    type: String,
    default: 'Learner',
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  isQuestion: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

chatMessageSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);


