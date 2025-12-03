const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Notification description is required'],
    trim: true,
  },
  thumbnail: {
    url: {
      type: String,
      trim: true,
      default: null,
    },
    publicId: {
      type: String,
      trim: true,
      default: null,
    },
  },
  video: {
    url: {
      type: String,
      trim: true,
      default: null,
    },
    publicId: {
      type: String,
      trim: true,
      default: null,
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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

// Validation: Ensure either thumbnail OR video, but not both
notificationSchema.pre('save', function(next) {
  const hasThumbnail = this.thumbnail && this.thumbnail.url;
  const hasVideo = this.video && this.video.url;
  
  if (!hasThumbnail && !hasVideo) {
    return next(new Error('Notification must have either a thumbnail or a video'));
  }
  
  if (hasThumbnail && hasVideo) {
    return next(new Error('Notification cannot have both thumbnail and video'));
  }
  
  this.updatedAt = Date.now();
  next();
});

// Index for efficient querying
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

