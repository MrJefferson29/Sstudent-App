const mongoose = require('mongoose');

const skillChapterSchema = new mongoose.Schema({
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: [true, 'Skill is required'],
  },
  title: {
    type: String,
    required: [true, 'Chapter title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  order: {
    type: Number,
    required: true,
    default: 0,
  },
  parentChapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkillChapter',
    default: null,
  },
  youtubeUrl: {
    type: String,
    trim: true,
    default: null,
    validate: {
      validator: function(v) {
        if (!v) return true;
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        return youtubeRegex.test(v);
      },
      message: 'Please provide a valid YouTube URL',
    },
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

skillChapterSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

skillChapterSchema.index({ skill: 1, order: 1 });
skillChapterSchema.index({ skill: 1, parentChapter: 1 });

module.exports = mongoose.model('SkillChapter', skillChapterSchema);

