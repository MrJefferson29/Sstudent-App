const CourseChapter = require('../models/CourseChapter');
const Course = require('../models/Course');
const { uploadBuffer, deleteResource } = require('../utils/cloudinary');

// Create a new chapter
exports.createChapter = async (req, res) => {
  try {
    const { course, title, description, order, parentChapter } = req.body;

    if (!course || !title) {
      return res.status(400).json({
        success: false,
        message: 'Course and title are required',
      });
    }

    // Verify course exists
    const courseExists = await Course.findById(course);
    if (!courseExists) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // If parentChapter is provided, verify it exists and belongs to the same course
    if (parentChapter) {
      const parentExists = await CourseChapter.findOne({ _id: parentChapter, course });
      if (!parentExists) {
        return res.status(404).json({
          success: false,
          message: 'Parent chapter not found or does not belong to this course',
        });
      }
    }

    let videoUrl = null;
    let videoPublicId = null;
    let duration = 0;

    // Handle video upload
    if (req.file) {
      const upload = await uploadBuffer(req.file.buffer, {
        folder: 'course-videos',
        resource_type: 'video',
      });
      videoUrl = upload.secure_url;
      videoPublicId = upload.public_id;
      // Note: Duration extraction from video would require additional processing
      // For now, duration can be set manually or via a separate API call
    }

    const chapter = await CourseChapter.create({
      course,
      title,
      description,
      order: order || 0,
      parentChapter: parentChapter || null,
      videoUrl,
      videoPublicId,
      duration,
    });

    const populatedChapter = await CourseChapter.findById(chapter._id)
      .populate('course', 'title')
      .populate('parentChapter', 'title');

    res.status(201).json({
      success: true,
      message: 'Chapter created successfully',
      data: populatedChapter,
    });
  } catch (error) {
    console.error('Create chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating chapter',
      error: error.message,
    });
  }
};

// Get all chapters for a course
exports.getChaptersByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const chapters = await CourseChapter.find({ course: courseId })
      .populate('parentChapter', 'title')
      .sort({ order: 1, createdAt: 1 });

    // Organize chapters: separate top-level chapters and sub-chapters
    const topLevelChapters = chapters.filter(ch => !ch.parentChapter);
    const subChapters = chapters.filter(ch => ch.parentChapter);

    // Group sub-chapters under their parent chapters
    const organizedChapters = topLevelChapters.map(parent => {
      const children = subChapters
        .filter(sub => sub.parentChapter && sub.parentChapter._id.toString() === parent._id.toString())
        .map(sub => {
          const { parentChapter, ...rest } = sub.toObject();
          return rest;
        });

      const { parentChapter, ...parentData } = parent.toObject();
      return {
        ...parentData,
        subChapters: children,
      };
    });

    res.status(200).json({
      success: true,
      data: organizedChapters,
    });
  } catch (error) {
    console.error('Get chapters error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chapters',
      error: error.message,
    });
  }
};

// Get a single chapter by ID
exports.getChapterById = async (req, res) => {
  try {
    const chapter = await CourseChapter.findById(req.params.id)
      .populate('course', 'title description')
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
    console.error('Get chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chapter',
      error: error.message,
    });
  }
};

// Update a chapter
exports.updateChapter = async (req, res) => {
  try {
    const { title, description, order, parentChapter } = req.body;
    const chapter = await CourseChapter.findById(req.params.id);

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

    // Handle video update
    if (req.file) {
      // Delete old video if exists
      if (chapter.videoPublicId) {
        await deleteResource(chapter.videoPublicId, 'video');
      }

      const upload = await uploadBuffer(req.file.buffer, {
        folder: 'course-videos',
        resource_type: 'video',
      });
      chapter.videoUrl = upload.secure_url;
      chapter.videoPublicId = upload.public_id;
    }

    await chapter.save();

    const populatedChapter = await CourseChapter.findById(chapter._id)
      .populate('course', 'title')
      .populate('parentChapter', 'title');

    res.status(200).json({
      success: true,
      message: 'Chapter updated successfully',
      data: populatedChapter,
    });
  } catch (error) {
    console.error('Update chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating chapter',
      error: error.message,
    });
  }
};

// Delete a chapter
exports.deleteChapter = async (req, res) => {
  try {
    const chapter = await CourseChapter.findById(req.params.id);

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found',
      });
    }

    // Check if chapter has sub-chapters
    const subChaptersCount = await CourseChapter.countDocuments({ parentChapter: chapter._id });
    if (subChaptersCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete chapter with sub-chapters. Please delete sub-chapters first.',
      });
    }

    // Delete video from Cloudinary
    if (chapter.videoPublicId) {
      await deleteResource(chapter.videoPublicId, 'video');
    }

    await CourseChapter.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Chapter deleted successfully',
    });
  } catch (error) {
    console.error('Delete chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting chapter',
      error: error.message,
    });
  }
};

