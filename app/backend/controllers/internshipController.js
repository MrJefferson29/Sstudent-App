const Internship = require('../models/Internship');
const { uploadBuffer, deleteResource } = require('../utils/cloudinary');

const normalizeImage = (image) => {
  if (!image) return null;
  if (typeof image === 'string') {
    return { url: image, publicId: null };
  }
  if (image.url) {
    return image;
  }
  return { url: image, publicId: null };
};

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

    let image = null;
    if (req.file) {
      const upload = await uploadBuffer(req.file.buffer, {
        folder: 'internships',
        resource_type: 'image',
      });
      image = {
        url: upload.secure_url,
        publicId: upload.public_id,
      };
    }

    // Create internship
    const internship = await Internship.create({
      title,
      company,
      location,
      duration,
      description,
      applicationLink,
      image,
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
      .sort({ createdAt: -1 })
      .lean();

    const normalized = internships.map((internship) => ({
      ...internship,
      image: normalizeImage(internship.image),
    }));

    res.status(200).json({
      success: true,
      count: normalized.length,
      data: normalized,
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
    const internshipDoc = await Internship.findById(req.params.id)
      .populate('uploadedBy', 'name email')
      .lean();

    if (!internshipDoc) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found',
      });
    }

    const internship = {
      ...internshipDoc,
      image: normalizeImage(internshipDoc.image),
    };

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

    // Find internship
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found',
      });
    }

    let image = normalizeImage(internship.image);
    if (req.file) {
      if (image?.publicId) {
        await deleteResource(image.publicId, 'image');
      }
      const upload = await uploadBuffer(req.file.buffer, {
        folder: 'internships',
        resource_type: 'image',
      });
      image = {
        url: upload.secure_url,
        publicId: upload.public_id,
      };
    }

    internship.title = title || internship.title;
    internship.company = company || internship.company;
    internship.location = location || internship.location;
    internship.duration = duration || internship.duration;
    internship.description = description || internship.description;
    internship.applicationLink = applicationLink || internship.applicationLink;
    internship.image = image;
    internship.updatedAt = Date.now();

    await internship.save();
    await internship.populate('uploadedBy', 'name email');

    const normalized = {
      ...internship.toObject(),
      image: normalizeImage(internship.image),
    };

    res.status(200).json({
      success: true,
      message: 'Internship updated successfully',
      data: normalized,
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

    // Find internship
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found',
      });
    }

    const image = normalizeImage(internship.image);
    if (image?.publicId) {
      await deleteResource(image.publicId, 'image');
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

