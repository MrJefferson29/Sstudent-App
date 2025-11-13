const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  contest: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', required: true, index: true },
  contestant: { type: mongoose.Schema.Types.ObjectId, ref: 'Contestant', required: true },
  createdAt: { type: Date, default: Date.now },
});

voteSchema.index({ user: 1, contest: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
