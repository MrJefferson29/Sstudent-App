const mongoose = require('mongoose');

const courseCommentSchema = new mongoose.Schema({
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseChapter',
    required: [true, 'Chapter is required'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
  },
  isQuestion: {
    type: Boolean,
    default: false, // If true, it's a question; if false, it's a comment
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseComment',
    default: null, // If null, it's a top-level comment; otherwise, it's a reply
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
courseCommentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient querying
courseCommentSchema.index({ chapter: 1, createdAt: -1 });
courseCommentSchema.index({ parentComment: 1 });

module.exports = mongoose.model('CourseComment', courseCommentSchema);

