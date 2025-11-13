const Scholarship = require('../models/Scholarship');
const path = require('path');
const fs = require('fs');

// Upload a new scholarship
exports.uploadScholarship = async (req, res) => {
  try {
    const { organizationName, description, location, websiteLink } = req.body;
    const userId = req.userId; // From auth middleware

    // Validation
    if (!organizationName || !description || !location || !websiteLink) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: organizationName, description, location, websiteLink',
      });
    }

    // Handle images - can be single file or multiple files
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      // Multiple images
      imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    } else if (req.file) {
      // Single image
      imageUrls = [`/uploads/${req.file.filename}`];
    }

    // At least one image is required
    if (imageUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required',
      });
    }

    // Create scholarship
    const scholarship = await Scholarship.create({
      organizationName,
      description,
      location,
      websiteLink,
      images: imageUrls,
      uploadedBy: userId,
    });

    res.status(201).json({
      success: true,
      message: 'Scholarship uploaded successfully',
      data: scholarship,
    });
  } catch (error) {
    console.error('Upload scholarship error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading scholarship',
      error: error.message,
    });
  }
};

// Get all scholarships
exports.getAllScholarships = async (req, res) => {
  try {
    const scholarships = await Scholarship.find()
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: scholarships.length,
      data: scholarships,
    });
  } catch (error) {
    console.error('Get scholarships error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching scholarships',
      error: error.message,
    });
  }
};

// Get single scholarship
exports.getScholarshipById = async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id)
      .populate('uploadedBy', 'name email');

    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship not found',
      });
    }

    res.status(200).json({
      success: true,
      data: scholarship,
    });
  } catch (error) {
    console.error('Get scholarship error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching scholarship',
      error: error.message,
    });
  }
};

// Update scholarship
exports.updateScholarship = async (req, res) => {
  try {
    const { organizationName, description, location, websiteLink } = req.body;
    const scholarshipId = req.params.id;
    const userId = req.userId; // From auth middleware

    // Find scholarship
    const scholarship = await Scholarship.findById(scholarshipId);
    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship not found',
      });
    }

    // Check if user is the owner (optional - you might want to allow admins to edit any)
    // For now, we'll allow any authenticated admin to edit

    // Handle new images if uploaded
    let imageUrls = scholarship.images || [];
    if (req.files && req.files.length > 0) {
      // Add new images to existing ones
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      imageUrls = [...imageUrls, ...newImages];
    } else if (req.file) {
      // Single new image
      imageUrls = [...imageUrls, `/uploads/${req.file.filename}`];
    }

    // Update scholarship
    const updateData = {
      organizationName: organizationName || scholarship.organizationName,
      description: description || scholarship.description,
      location: location || scholarship.location,
      websiteLink: websiteLink || scholarship.websiteLink,
      images: imageUrls,
      updatedAt: Date.now(),
    };

    const updatedScholarship = await Scholarship.findByIdAndUpdate(
      scholarshipId,
      updateData,
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Scholarship updated successfully',
      data: updatedScholarship,
    });
  } catch (error) {
    console.error('Update scholarship error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating scholarship',
      error: error.message,
    });
  }
};

// Delete scholarship
exports.deleteScholarship = async (req, res) => {
  try {
    const scholarshipId = req.params.id;
    const userId = req.userId; // From auth middleware

    // Find scholarship
    const scholarship = await Scholarship.findById(scholarshipId);
    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship not found',
      });
    }

    // Delete associated image files
    if (scholarship.images && scholarship.images.length > 0) {
      scholarship.images.forEach(imagePath => {
        const filePath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    // Delete scholarship
    await Scholarship.findByIdAndDelete(scholarshipId);

    res.status(200).json({
      success: true,
      message: 'Scholarship deleted successfully',
    });
  } catch (error) {
    console.error('Delete scholarship error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting scholarship',
      error: error.message,
    });
  }
};

// Delete image from scholarship
exports.deleteScholarshipImage = async (req, res) => {
  try {
    const { scholarshipId } = req.params;
    const { imageUrl } = req.body; // Get image URL from request body
    const userId = req.userId; // From auth middleware

    // Find scholarship
    const scholarship = await Scholarship.findById(scholarshipId);
    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship not found',
      });
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required',
      });
    }

    // Remove image from array (imageUrl should be the full path like /uploads/filename.jpg)
    const imageIndex = scholarship.images.findIndex(img => img === imageUrl);
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found',
      });
    }

    // Delete image file
    const filePath = path.join(__dirname, '..', imageUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from array
    scholarship.images.splice(imageIndex, 1);
    await scholarship.save();

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: scholarship,
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message,
    });
  }
};

