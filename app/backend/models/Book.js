const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, trim: true },
    category: { type: String, trim: true },
    description: { type: String, trim: true },
    publishedDate: { type: String, trim: true },
    pdfUrl: { type: String, required: true },
    pdfPublicId: { type: String }, // For storage reference (Firebase path or direct path)
    thumbnail: {
      url: { type: String, trim: true },
      publicId: { type: String, trim: true },
    },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Book', bookSchema);

