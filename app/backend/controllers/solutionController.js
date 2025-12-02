const Solution = require('../models/Solution');
const Question = require('../models/Question');
const { uploadBuffer, deleteResource, updateAccessMode } = require('../utils/storage');

// Upload a new solution
exports.uploadSolution = async (req, res) => {
  try {
    const { questionId, youtubeUrl } = req.body;
    const userId = req.userId; // From auth middleware

    // Validation
    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: 'Question ID is required',
      });
    }

    // Check if question exists
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    // At least one of youtubeUrl or pdfUrl must be provided
    let pdfUrl = null;
    let pdfPublicId = null;

    if (req.file) {
      const upload = await uploadBuffer(req.file.buffer, {
        folder: 'solutions',
        contentType: 'application/pdf',
      });
      
      pdfUrl = upload.secure_url;
      pdfPublicId = upload.public_id;
    }

    if (!youtubeUrl && !pdfUrl) {
      return res.status(400).json({
        success: false,
        message: 'Either YouTube URL or PDF file must be provided',
      });
    }

    // Create solution
    const solution = await Solution.create({
      question: questionId,
      youtubeUrl: youtubeUrl || null,
      pdfUrl: pdfUrl || null,
      pdfPublicId: pdfPublicId || null,
      uploadedBy: userId,
    });

    res.status(201).json({
      success: true,
      message: 'Solution uploaded successfully',
      data: solution,
    });
  } catch (error) {
    console.error('Upload solution error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading solution',
      error: error.message,
    });
  }
};

// Get all solutions (optionally filtered by question)
exports.getAllSolutions = async (req, res) => {
  try {
    const { questionId } = req.query;
    
    const filter = {};
    if (questionId) filter.question = questionId;

    const solutions = await Solution.find(filter)
      .populate('question', 'school department level subject year')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: solutions.length,
      data: solutions,
    });
  } catch (error) {
    console.error('Get solutions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching solutions',
      error: error.message,
    });
  }
};

// Get a single solution by ID
exports.getSolutionById = async (req, res) => {
  try {
    const solution = await Solution.findById(req.params.id)
      .populate('question', 'school department level subject year pdfUrl')
      .populate('uploadedBy', 'name email');

    if (!solution) {
      return res.status(404).json({
        success: false,
        message: 'Solution not found',
      });
    }

    res.status(200).json({
      success: true,
      data: solution,
    });
  } catch (error) {
    console.error('Get solution error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching solution',
      error: error.message,
    });
  }
};

// Delete a solution (only by uploader)
exports.deleteSolution = async (req, res) => {
  try {
    const solution = await Solution.findById(req.params.id);

    if (!solution) {
      return res.status(404).json({
        success: false,
        message: 'Solution not found',
      });
    }

    // Check if user is the uploader
    if (solution.uploadedBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this solution',
      });
    }

    if (solution.pdfPublicId) {
      await deleteResource(solution.pdfPublicId, 'raw');
    }

    await Solution.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Solution deleted successfully',
    });
  } catch (error) {
    console.error('Delete solution error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting solution',
      error: error.message,
    });
  }
};

