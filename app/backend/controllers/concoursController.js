const Concours = require('../models/Concours');
const Department = require('../models/Department');
const { uploadBuffer, deleteResource } = require('../utils/cloudinary');

// Upload a new concours
exports.uploadConcours = async (req, res) => {
  try {
    const { title, description, year, department } = req.body;
    const userId = req.userId;

    if (!title || !year || !department) {
      return res.status(400).json({
        success: false,
        message: 'Title, year, and department are required',
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
      folder: 'concours',
      resource_type: 'raw',
      format: 'pdf',
    });

    const concours = await Concours.create({
      title,
      description,
      year,
      department,
      pdfUrl: upload.secure_url,
      pdfPublicId: upload.public_id,
      uploadedBy: userId,
    });

    const populatedConcours = await Concours.findById(concours._id)
      .populate('department', 'name school')
      .populate('department.school', 'name')
      .populate('uploadedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Concours uploaded successfully',
      data: populatedConcours,
    });
  } catch (error) {
    console.error('Upload concours error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading concours',
      error: error.message,
    });
  }
};

// Get all concours (optionally filtered by department)
exports.getAllConcours = async (req, res) => {
  try {
    const { department, year } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (year) filter.year = year;

    const concours = await Concours.find(filter)
      .populate('department', 'name school')
      .populate('department.school', 'name')
      .populate('uploadedBy', 'name email')
      .sort({ year: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: concours.length,
      data: concours,
    });
  } catch (error) {
    console.error('Get concours error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching concours',
      error: error.message,
    });
  }
};

// Get a single concours by ID
exports.getConcoursById = async (req, res) => {
  try {
    const concours = await Concours.findById(req.params.id)
      .populate('department', 'name school')
      .populate('department.school', 'name')
      .populate('uploadedBy', 'name email');

    if (!concours) {
      return res.status(404).json({
        success: false,
        message: 'Concours not found',
      });
    }

    res.status(200).json({
      success: true,
      data: concours,
    });
  } catch (error) {
    console.error('Get concours error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching concours',
      error: error.message,
    });
  }
};

// Update a concours
exports.updateConcours = async (req, res) => {
  try {
    const { title, description, year, department } = req.body;
    const concours = await Concours.findById(req.params.id);

    if (!concours) {
      return res.status(404).json({
        success: false,
        message: 'Concours not found',
      });
    }

    // If department is being changed, verify it exists
    if (department && department !== concours.department.toString()) {
      const departmentExists = await Department.findById(department);
      if (!departmentExists) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
        });
      }
    }

    if (title) concours.title = title;
    if (description !== undefined) concours.description = description;
    if (year) concours.year = year;
    if (department) concours.department = department;

    // Handle PDF update
    if (req.file) {
      // Delete old PDF if exists
      if (concours.pdfPublicId) {
        await deleteResource(concours.pdfPublicId, 'raw');
      }

      const upload = await uploadBuffer(req.file.buffer, {
        folder: 'concours',
        resource_type: 'raw',
        format: 'pdf',
      });
      concours.pdfUrl = upload.secure_url;
      concours.pdfPublicId = upload.public_id;
    }

    await concours.save();

    const populatedConcours = await Concours.findById(concours._id)
      .populate('department', 'name')
      .populate('uploadedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Concours updated successfully',
      data: populatedConcours,
    });
  } catch (error) {
    console.error('Update concours error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating concours',
      error: error.message,
    });
  }
};

// Delete a concours
exports.deleteConcours = async (req, res) => {
  try {
    const concours = await Concours.findById(req.params.id);

    if (!concours) {
      return res.status(404).json({
        success: false,
        message: 'Concours not found',
      });
    }

    // Delete PDF from Cloudinary
    if (concours.pdfPublicId) {
      await deleteResource(concours.pdfPublicId, 'raw');
    }

    await Concours.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Concours deleted successfully',
    });
  } catch (error) {
    console.error('Delete concours error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting concours',
      error: error.message,
    });
  }
};

