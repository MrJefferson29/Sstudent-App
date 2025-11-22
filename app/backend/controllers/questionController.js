const Question = require('../models/Question');
const Solution = require('../models/Solution');
const Department = require('../models/Department');
const { uploadBuffer, deleteResource, updateAccessMode } = require('../utils/cloudinary');

// Upload a new question
exports.uploadQuestion = async (req, res) => {
  try {
    const { department, level, subject, year } = req.body;
    const userId = req.userId; // From auth middleware

    // Validation
    if (!department || !level || !subject || !year) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: department, level, subject, year',
      });
    }

    // Verify department exists
    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'PDF file is required',
      });
    }

    const upload = await uploadBuffer(req.file.buffer, {
      folder: 'questions',
      resource_type: 'raw',
      format: 'pdf',
      access_mode: 'public', // Explicitly set for PDFs
    });

    // Double-check and fix access mode if needed (sometimes Cloudinary ignores it)
    if (upload.public_id) {
      try {
        // Verify and ensure it's public
        await updateAccessMode(upload.public_id, 'raw');
        console.log(`Ensured PDF ${upload.public_id} is public`);
      } catch (error) {
        console.warn(`Warning: Could not verify access mode for ${upload.public_id}:`, error.message);
        // Continue anyway - the upload succeeded
      }
    }

    const question = await Question.create({
      department,
      level,
      subject,
      year,
      pdfUrl: upload.secure_url,
      pdfPublicId: upload.public_id,
      uploadedBy: userId,
    });

    const populatedQuestion = await Question.findById(question._id)
      .populate('department', 'name school')
      .populate('department.school', 'name')
      .populate('uploadedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Question uploaded successfully',
      data: populatedQuestion,
    });
  } catch (error) {
    console.error('Upload question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading question',
      error: error.message,
    });
  }
};

// Get all questions with optional filters
exports.getAllQuestions = async (req, res) => {
  try {
    const { department, level, subject, year } = req.query;
    
    // Build filter object
    const filter = {};
    if (department) filter.department = department;
    if (level) filter.level = level;
    if (subject) {
      // Case-insensitive regex search for subject (escape special regex characters)
      const escapedSubject = subject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.subject = { $regex: new RegExp(`^${escapedSubject}$`, 'i') };
    }
    if (year) filter.year = year;

    const questions = await Question.find(filter)
      .populate('department', 'name school')
      .populate('department.school', 'name')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions,
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching questions',
      error: error.message,
    });
  }
};

// Get a single question by ID
exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('department', 'name school')
      .populate('department.school', 'name')
      .populate('uploadedBy', 'name email');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    // Get solutions for this question
    const solutions = await Solution.find({ question: question._id })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        question,
        solutions,
      },
    });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching question',
      error: error.message,
    });
  }
};

// Get unique subjects for a department and level
exports.getSubjects = async (req, res) => {
  try {
    const { department, level } = req.query;

    // Build filter object
    const filter = {};
    if (department) filter.department = department;
    if (level) filter.level = level;

    // Get distinct subjects for the given department and level
    const subjects = await Question.distinct('subject', filter);

    // Sort subjects alphabetically
    const sortedSubjects = subjects.sort((a, b) => a.localeCompare(b));

    res.status(200).json({
      success: true,
      count: sortedSubjects.length,
      data: sortedSubjects,
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subjects',
      error: error.message,
    });
  }
};

// Fix access mode for all question PDFs (admin only)
exports.fixAllQuestionPDFs = async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can fix PDF access modes',
      });
    }

    const questions = await Question.find({ pdfPublicId: { $exists: true, $ne: null } });
    let fixed = 0;
    let failed = 0;
    const errors = [];

    for (const question of questions) {
      try {
        await updateAccessMode(question.pdfPublicId, 'raw');
        fixed++;
        console.log(`Fixed PDF: ${question.pdfPublicId}`);
      } catch (error) {
        failed++;
        errors.push({
          questionId: question._id,
          publicId: question.pdfPublicId,
          error: error.message,
        });
        console.error(`Failed to fix PDF ${question.pdfPublicId}:`, error.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Fixed ${fixed} PDFs. ${failed} failed.`,
      fixed,
      failed,
      total: questions.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Fix PDFs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fixing PDFs',
      error: error.message,
    });
  }
};

// Delete a question (only by uploader or admin)
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    // Check if user is the uploader
    if (question.uploadedBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this question',
      });
    }

    // Delete associated solutions
    const solutions = await Solution.find({ question: question._id });
    await Promise.all(
      solutions.map(async (solution) => {
        if (solution.pdfPublicId) {
          await deleteResource(solution.pdfPublicId, 'raw');
        }
        await Solution.findByIdAndDelete(solution._id);
      })
    );

    if (question.pdfPublicId) {
      await deleteResource(question.pdfPublicId, 'raw');
    }

    // Delete the question
    await Question.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting question',
      error: error.message,
    });
  }
};

