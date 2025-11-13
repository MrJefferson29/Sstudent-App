const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema({
  organizationName: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
  },
  websiteLink: {
    type: String,
    required: [true, 'Website link is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Please provide a valid URL',
    },
  },
  images: [
    {
      url: {
        type: String,
        required: [true, 'Image URL is required'],
        trim: true,
      },
      publicId: {
        type: String,
        trim: true,
      },
    },
  ],
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
scholarshipSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient querying
scholarshipSchema.index({ organizationName: 1, location: 1 });
scholarshipSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Scholarship', scholarshipSchema);

