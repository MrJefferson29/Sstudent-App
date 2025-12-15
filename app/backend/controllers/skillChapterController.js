const SkillChapter = require('../models/SkillChapter');
const Skill = require('../models/Skill');

const extractYouTubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

// Create a new skill chapter
exports.createChapter = async (req, res) => {
  try {
    const { skill, title, description, order, parentChapter, youtubeUrl } = req.body;

    if (!skill || !title) {
      return res.status(400).json({
        success: false,
        message: 'Skill and title are required',
      });
    }

    const skillExists = await Skill.findById(skill);
    if (!skillExists) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found',
      });
    }

    if (parentChapter) {
      const parentExists = await SkillChapter.findOne({ _id: parentChapter, skill });
      if (!parentExists) {
        return res.status(404).json({
          success: false,
          message: 'Parent chapter not found or does not belong to this skill',
        });
      }
    }

    let normalizedYoutubeUrl = null;
    if (youtubeUrl && youtubeUrl.trim()) {
      const videoId = extractYouTubeId(youtubeUrl);
      if (videoId) {
        normalizedYoutubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid YouTube URL. Please provide a valid YouTube video link.',
        });
      }
    }

    const chapter = await SkillChapter.create({
      skill,
      title,
      description,
      order: order || 0,
      parentChapter: parentChapter || null,
      youtubeUrl: normalizedYoutubeUrl,
    });

    const populatedChapter = await SkillChapter.findById(chapter._id)
      .populate('skill', 'name')
      .populate('parentChapter', 'title');

    res.status(201).json({
      success: true,
      message: 'Chapter created successfully',
      data: populatedChapter,
    });
  } catch (error) {
    console.error('Create skill chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating chapter',
      error: error.message,
    });
  }
};

// Get all chapters for a skill
exports.getChaptersBySkill = async (req, res) => {
  try {
    const { skillId } = req.params;

    const chapters = await SkillChapter.find({ skill: skillId })
      .populate('parentChapter', 'title')
      .sort({ order: 1, createdAt: 1 });

    const topLevel = chapters.filter(ch => !ch.parentChapter);
    const children = chapters.filter(ch => ch.parentChapter);

    const organized = topLevel.map(parent => {
      const kids = children
        .filter(sub => sub.parentChapter && sub.parentChapter._id.toString() === parent._id.toString())
        .map(sub => {
          const { parentChapter, ...rest } = sub.toObject();
          return rest;
        });

      const { parentChapter, ...parentData } = parent.toObject();
      return {
        ...parentData,
        subChapters: kids,
      };
    });

    res.status(200).json({
      success: true,
      data: organized,
    });
  } catch (error) {
    console.error('Get skill chapters error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching skill chapters',
      error: error.message,
    });
  }
};

// Get a single skill chapter by ID
exports.getChapterById = async (req, res) => {
  try {
    const chapter = await SkillChapter.findById(req.params.id)
      .populate('skill', 'name description')
      .populate('parentChapter', 'title');

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found',
      });
    }

    res.status(200).json({
      success: true,
      data: chapter,
    });
  } catch (error) {
    console.error('Get skill chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chapter',
      error: error.message,
    });
  }
};

// Update a skill chapter
exports.updateChapter = async (req, res) => {
  try {
    const { title, description, order, parentChapter, youtubeUrl } = req.body;
    const chapter = await SkillChapter.findById(req.params.id);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found',
      });
    }

    if (title) chapter.title = title;
    if (description !== undefined) chapter.description = description;
    if (order !== undefined) chapter.order = order;
    if (parentChapter !== undefined) chapter.parentChapter = parentChapter;

    if (youtubeUrl !== undefined) {
      if (youtubeUrl && youtubeUrl.trim()) {
        const videoId = extractYouTubeId(youtubeUrl);
        if (videoId) {
          chapter.youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Invalid YouTube URL. Please provide a valid YouTube video link.',
          });
        }
      } else {
        chapter.youtubeUrl = null;
      }
    }

    await chapter.save();

    const populatedChapter = await SkillChapter.findById(chapter._id)
      .populate('skill', 'name')
      .populate('parentChapter', 'title');

    res.status(200).json({
      success: true,
      message: 'Chapter updated successfully',
      data: populatedChapter,
    });
  } catch (error) {
    console.error('Update skill chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating chapter',
      error: error.message,
    });
  }
};

// Delete a skill chapter
exports.deleteChapter = async (req, res) => {
  try {
    const chapter = await SkillChapter.findById(req.params.id);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found',
      });
    }

    const subCount = await SkillChapter.countDocuments({ parentChapter: chapter._id });
    if (subCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete chapter with sub-chapters. Please delete sub-chapters first.',
      });
    }

    await SkillChapter.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Chapter deleted successfully',
    });
  } catch (error) {
    console.error('Delete skill chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting chapter',
      error: error.message,
    });
  }
};

