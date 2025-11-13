const mongoose = require('mongoose')

const LiveMessageSchema = new mongoose.Schema(
  {
    room: { type: String, required: true, index: true },
    username: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
)

module.exports = mongoose.models.LiveMessage || mongoose.model('LiveMessage', LiveMessageSchema)