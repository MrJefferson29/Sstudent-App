const Scholarship = require('../models/Scholarship');
const { uploadBuffer, deleteResource } = require('../utils/cloudinary');

const normalizeImages = (images = []) =>
  images.map((image) => {
    if (typeof image === 'string') {
      return { url: image, publicId: null };
    }
    return image;
  });

// Upload a new scholarship
exports.uploadScholarship = async (req, res) => {
  try {
    const { organizationName, description, location, websiteLink } = req.body;
    const userId = req.userId;

    if (!organizationName || !description || !location || !websiteLink) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide all required fields: organizationName, description, location, websiteLink',
      });
    }

    const files = req.files?.length ? req.files : req.file ? [req.file] : [];

    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one image is required',
      });
    }

    const uploads = await Promise.all(
      files.map((file) =>
        uploadBuffer(file.buffer, { folder: 'scholarships', resource_type: 'image' })
      )
    );

    const imageData = uploads.map((upload) => ({
      url: upload.secure_url,
      publicId: upload.public_id,
    }));

    const scholarship = await Scholarship.create({
      organizationName,
      description,
      location,
      websiteLink,
      images: imageData,
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
      .sort({ createdAt: -1 })
      .lean();

    const normalized = scholarships.map((item) => ({
      ...item,
      images: normalizeImages(item.images),
    }));

    res.status(200).json({
      success: true,
      count: normalized.length,
      data: normalized,
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
    const scholarshipDoc = await Scholarship.findById(req.params.id)
      .populate('uploadedBy', 'name email')
      .lean();

    if (!scholarshipDoc) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship not found',
      });
    }

    const scholarship = {
      ...scholarshipDoc,
      images: normalizeImages(scholarshipDoc.images),
    };

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

    const scholarship = await Scholarship.findById(scholarshipId);
    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship not found',
      });
    }

    const files = req.files?.length ? req.files : req.file ? [req.file] : [];

    let newImages = [];
    if (files.length > 0) {
      const uploads = await Promise.all(
        files.map((file) =>
          uploadBuffer(file.buffer, { folder: 'scholarships', resource_type: 'image' })
        )
      );
      newImages = uploads.map((upload) => ({
        url: upload.secure_url,
        publicId: upload.public_id,
      }));
    }

    const normalizedExisting = normalizeImages(scholarship.images);

    scholarship.organizationName = organizationName || scholarship.organizationName;
    scholarship.description = description || scholarship.description;
    scholarship.location = location || scholarship.location;
    scholarship.websiteLink = websiteLink || scholarship.websiteLink;
    scholarship.images = [...normalizedExisting, ...newImages];
    scholarship.updatedAt = Date.now();

    const updatedScholarship = await scholarship.save();

    res.status(200).json({
      success: true,
      message: 'Scholarship updated successfully',
      data: {
        ...updatedScholarship.toObject(),
        images: normalizeImages(updatedScholarship.images),
      },
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

    const scholarship = await Scholarship.findById(scholarshipId);
    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship not found',
      });
    }

    const normalizedImages = normalizeImages(scholarship.images);
    await Promise.all(
      normalizedImages.map((image) =>
        image.publicId ? deleteResource(image.publicId, 'image') : Promise.resolve()
      )
    );

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
    const { imagePublicId, imageUrl } = req.body;

    if (!imagePublicId && !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image identifier is required',
      });
    }

    const scholarship = await Scholarship.findById(scholarshipId);
    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship not found',
      });
    }

    const normalizedImages = normalizeImages(scholarship.images);
    const targetIndex = normalizedImages.findIndex(
      (image) =>
        (imagePublicId && image.publicId === imagePublicId) ||
        (imageUrl && image.url === imageUrl)
    );

    if (targetIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found',
      });
    }

    const [removedImage] = normalizedImages.splice(targetIndex, 1);

    if (removedImage?.publicId) {
      await deleteResource(removedImage.publicId, 'image');
    }

    scholarship.images = normalizedImages;
    const updatedScholarship = await scholarship.save();

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: {
        ...updatedScholarship.toObject(),
        images: normalizeImages(updatedScholarship.images),
      },
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
