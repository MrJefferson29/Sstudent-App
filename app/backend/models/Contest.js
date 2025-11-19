const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  startAt: { type: Date },
  endAt: { type: Date },
  // Voting restrictions: 'all', 'school', 'department'
  votingRestriction: {
    type: String,
    enum: ['all', 'school', 'department'],
    default: 'all',
  },
  // If restriction is 'school', this field contains the school ID
  restrictedSchool: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    default: null,
  },
  // If restriction is 'department', this field contains the department ID
  restrictedDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Contest', contestSchema);
