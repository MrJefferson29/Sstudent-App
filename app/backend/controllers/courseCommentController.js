const CourseComment = require('../models/CourseComment');
const CourseChapter = require('../models/CourseChapter');

// Create a new comment/question
exports.createComment = async (req, res) => {
  try {
    const { chapter, text, isQuestion, parentComment } = req.body;
    const userId = req.userId;

    if (!chapter || !text) {
      return res.status(400).json({
        success: false,
        message: 'Chapter and text are required',
      });
    }

    // Verify chapter exists
    const chapterExists = await CourseChapter.findById(chapter);
    if (!chapterExists) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found',
      });
    }

    // If parentComment is provided, verify it exists and belongs to the same chapter
    if (parentComment) {
      const parentExists = await CourseComment.findOne({ _id: parentComment, chapter });
      if (!parentExists) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found or does not belong to this chapter',
        });
      }
    }

    const comment = await CourseComment.create({
      chapter,
      user: userId,
      text,
      isQuestion: isQuestion || false,
      parentComment: parentComment || null,
    });

    const populatedComment = await CourseComment.findById(comment._id)
      .populate('user', 'name email profilePicture')
      .populate('parentComment', 'text user')
      .populate('parentComment.user', 'name');

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: populatedComment,
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating comment',
      error: error.message,
    });
  }
};

// Get all comments/questions for a chapter
exports.getCommentsByChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { type } = req.query; // 'question', 'comment', or undefined for all

    const filter = { chapter: chapterId, parentComment: null }; // Only top-level comments
    if (type === 'question') {
      filter.isQuestion = true;
    } else if (type === 'comment') {
      filter.isQuestion = false;
    }

    const comments = await CourseComment.find(filter)
      .populate('user', 'name email profilePicture')
      .sort({ createdAt: -1 });

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await CourseComment.find({ parentComment: comment._id })
          .populate('user', 'name email profilePicture')
          .sort({ createdAt: 1 })
          .lean();

        return {
          ...comment.toObject(),
          replies,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: commentsWithReplies,
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments',
      error: error.message,
    });
  }
};

// Get a single comment by ID
exports.getCommentById = async (req, res) => {
  try {
    const comment = await CourseComment.findById(req.params.id)
      .populate('user', 'name email profilePicture')
      .populate('parentComment', 'text user')
      .populate('parentComment.user', 'name');

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    res.status(200).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error('Get comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comment',
      error: error.message,
    });
  }
};

// Update a comment (only by the author)
exports.updateComment = async (req, res) => {
  try {
    const { text } = req.body;
    const comment = await CourseComment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check if user is the author
    if (comment.user.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment',
      });
    }

    if (text) comment.text = text;
    await comment.save();

    const populatedComment = await CourseComment.findById(comment._id)
      .populate('user', 'name email profilePicture')
      .populate('parentComment', 'text user');

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: populatedComment,
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating comment',
      error: error.message,
    });
  }
};

// Delete a comment (only by the author or admin)
exports.deleteComment = async (req, res) => {
  try {
    const comment = await CourseComment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check if user is the author (admin check can be added separately)
    if (comment.user.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment',
      });
    }

    // Delete all replies to this comment
    await CourseComment.deleteMany({ parentComment: comment._id });

    // Delete the comment
    await CourseComment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting comment',
      error: error.message,
    });
  }
};

