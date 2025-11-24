const mongoose = require('mongoose');

const liveSessionSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    courseTitle: {
      type: String,
      required: true,
      trim: true,
    },
    courseCode: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    lecturer: {
      type: String,
      required: true,
      trim: true,
    },
    youtubeUrl: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended'],
      default: 'scheduled',
    },
    scheduledAt: {
      type: Date,
      default: Date.now,
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

liveSessionSchema.index({ department: 1, status: 1, scheduledAt: 1 });

module.exports = mongoose.model('LiveSession', liveSessionSchema);


