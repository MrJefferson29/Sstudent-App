const mongoose = require('mongoose');

const concoursSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Concours title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  year: {
    type: String,
    required: [true, 'Year is required'],
    trim: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required'],
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
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
concoursSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient querying
concoursSchema.index({ department: 1, year: 1 });

module.exports = mongoose.model('Concours', concoursSchema);

