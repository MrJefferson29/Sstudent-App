const Question = require('../models/Question');
const Solution = require('../models/Solution');
const { uploadBuffer, deleteResource } = require('../utils/cloudinary');

// Upload a new question
exports.uploadQuestion = async (req, res) => {
  try {
    const { school, department, level, subject, year } = req.body;
    const userId = req.userId; // From auth middleware

    // Validation
    if (!school || !department || !level || !subject || !year) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: school, department, level, subject, year',
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
    });

    const question = await Question.create({
      school,
      department,
      level,
      subject,
      year,
      pdfUrl: upload.secure_url,
      pdfPublicId: upload.public_id,
      uploadedBy: userId,
    });

    res.status(201).json({
      success: true,
      message: 'Question uploaded successfully',
      data: question,
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
    const { school, department, level, subject, year } = req.query;
    
    // Build filter object with case-insensitive matching
    const filter = {};
    if (school) {
      // Case-insensitive regex search for school (escape special regex characters)
      const escapedSchool = school.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.school = { $regex: new RegExp(`^${escapedSchool}$`, 'i') };
    }
    if (department) {
      // Case-insensitive regex search for department (escape special regex characters)
      const escapedDepartment = department.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.department = { $regex: new RegExp(`^${escapedDepartment}$`, 'i') };
    }
    if (level) filter.level = level;
    if (subject) {
      // Case-insensitive regex search for subject (escape special regex characters)
      const escapedSubject = subject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.subject = { $regex: new RegExp(`^${escapedSubject}$`, 'i') };
    }
    if (year) filter.year = year;

    const questions = await Question.find(filter)
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

