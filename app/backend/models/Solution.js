const mongoose = require('mongoose');

const solutionSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: [true, 'Question ID is required'],
  },
  youtubeUrl: {
    type: String,
    trim: true,
    default: null,
  },
  pdfUrl: {
    type: String,
    trim: true,
    default: null,
  },
  pdfPublicId: {
    type: String,
    trim: true,
    default: null,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Custom validation: At least one of youtubeUrl or pdfUrl must be present
solutionSchema.pre('validate', function(next) {
  if (!this.youtubeUrl && !this.pdfUrl) {
    this.invalidate('youtubeUrl', 'Either YouTube URL or PDF URL must be provided');
    this.invalidate('pdfUrl', 'Either YouTube URL or PDF URL must be provided');
  }
  next();
});

// Index for efficient querying
solutionSchema.index({ question: 1 });

module.exports = mongoose.model('Solution', solutionSchema);

