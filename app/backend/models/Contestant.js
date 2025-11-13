const mongoose = require('mongoose');

const contestantSchema = new mongoose.Schema({
  contest: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', required: true, index: true },
  name: { type: String, required: true, trim: true },
  bio: { type: String, trim: true },
  image: {
    url: { type: String, trim: true },
    publicId: { type: String, trim: true },
  },
  metadata: { type: Object },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Contestant', contestantSchema);
