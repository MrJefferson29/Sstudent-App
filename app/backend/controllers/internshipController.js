const Internship = require('../models/Internship');
const path = require('path');
const fs = require('fs');

// Upload a new internship
exports.uploadInternship = async (req, res) => {
  try {
    const { title, company, location, duration, description, applicationLink } = req.body;
    const userId = req.userId; // From auth middleware

    // Validation
    if (!title || !company || !location || !duration || !description || !applicationLink) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, company, location, duration, description, applicationLink',
      });
    }

    // Handle image - optional but recommended
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Create internship
    const internship = await Internship.create({
      title,
      company,
      location,
      duration,
      description,
      applicationLink,
      image: imageUrl,
      uploadedBy: userId,
    });

    res.status(201).json({
      success: true,
      message: 'Internship uploaded successfully',
      data: internship,
    });
  } catch (error) {
    console.error('Upload internship error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading internship',
      error: error.message,
    });
  }
};

// Get all internships
exports.getAllInternships = async (req, res) => {
  try {
    const internships = await Internship.find()
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: internships.length,
      data: internships,
    });
  } catch (error) {
    console.error('Get internships error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching internships',
      error: error.message,
    });
  }
};

// Get single internship
exports.getInternshipById = async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id)
      .populate('uploadedBy', 'name email');

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found',
      });
    }

    res.status(200).json({
      success: true,
      data: internship,
    });
  } catch (error) {
    console.error('Get internship error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching internship',
      error: error.message,
    });
  }
};

// Update internship
exports.updateInternship = async (req, res) => {
  try {
    const { title, company, location, duration, description, applicationLink } = req.body;
    const internshipId = req.params.id;
    const userId = req.userId; // From auth middleware

    // Find internship
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found',
      });
    }

    // Handle new image if uploaded
    let imageUrl = internship.image;
    if (req.file) {
      // Delete old image if exists
      if (internship.image) {
        const oldFilePath = path.join(__dirname, '..', internship.image);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Update internship
    const updateData = {
      title: title || internship.title,
      company: company || internship.company,
      location: location || internship.location,
      duration: duration || internship.duration,
      description: description || internship.description,
      applicationLink: applicationLink || internship.applicationLink,
      image: imageUrl,
      updatedAt: Date.now(),
    };

    const updatedInternship = await Internship.findByIdAndUpdate(
      internshipId,
      updateData,
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Internship updated successfully',
      data: updatedInternship,
    });
  } catch (error) {
    console.error('Update internship error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating internship',
      error: error.message,
    });
  }
};

// Delete internship
exports.deleteInternship = async (req, res) => {
  try {
    const internshipId = req.params.id;
    const userId = req.userId; // From auth middleware

    // Find internship
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found',
      });
    }

    // Delete associated image file
    if (internship.image) {
      const filePath = path.join(__dirname, '..', internship.image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete internship
    await Internship.findByIdAndDelete(internshipId);

    res.status(200).json({
      success: true,
      message: 'Internship deleted successfully',
    });
  } catch (error) {
    console.error('Delete internship error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting internship',
      error: error.message,
    });
  }
};

