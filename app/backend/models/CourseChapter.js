const mongoose = require('mongoose');

const courseChapterSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required'],
  },
  title: {
    type: String,
    required: [true, 'Chapter title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  order: {
    type: Number,
    required: true,
    default: 0,
  },
  parentChapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseChapter',
    default: null, // If null, it's a top-level chapter; otherwise, it's a sub-chapter
  },
  videoUrl: {
    type: String,
    trim: true,
    default: null,
  },
  videoPublicId: {
    type: String,
    trim: true,
    default: null,
  },
  duration: {
    type: Number, // Duration in seconds
    default: 0,
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
courseChapterSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient querying
courseChapterSchema.index({ course: 1, order: 1 });
courseChapterSchema.index({ course: 1, parentChapter: 1 });

module.exports = mongoose.model('CourseChapter', courseChapterSchema);

