const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required'],
  },
  level: {
    type: String,
    required: [true, 'Level is required'],
    trim: true,
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
  },
  year: {
    type: String,
    required: [true, 'Year is required'],
    trim: true,
  },
  pdfUrl: {
    type: String,
    required: [true, 'PDF URL is required'],
  },
  pdfPublicId: {
    type: String,
    trim: true,
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

// Index for efficient querying
questionSchema.index({ department: 1, level: 1, subject: 1, year: 1 });

module.exports = mongoose.model('Question', questionSchema);

