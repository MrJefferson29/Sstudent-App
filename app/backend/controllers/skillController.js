const Skill = require('../models/Skill');
const { uploadBuffer, deleteResource } = require('../utils/cloudinary');

// Create a new skill
exports.createSkill = async (req, res) => {
  try {
    const { name, category, description } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Skill name is required',
      });
    }

    let thumbnail = null;
    if (req.file) {
      const upload = await uploadBuffer(req.file.buffer, {
        folder: 'skills',
        resource_type: 'image',
      });
      thumbnail = {
        url: upload.secure_url,
        publicId: upload.public_id,
      };
    }

    const skill = await Skill.create({
      name,
      category,
      description,
      thumbnail,
      createdBy: userId,
    });

    const populatedSkill = await Skill.findById(skill._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Skill created successfully',
      data: populatedSkill,
    });
  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating skill',
      error: error.message,
    });
  }
};

// Get all skills (optionally filtered by category)
exports.getAllSkills = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category) filter.category = category;

    const skills = await Skill.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: skills.length,
      data: skills,
    });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching skills',
      error: error.message,
    });
  }
};

// Get a single skill by ID
exports.getSkillById = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found',
      });
    }

    res.status(200).json({
      success: true,
      data: skill,
    });
  } catch (error) {
    console.error('Get skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching skill',
      error: error.message,
    });
  }
};

// Update a skill
exports.updateSkill = async (req, res) => {
  try {
    const { name, category, description } = req.body;
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found',
      });
    }

    if (name) skill.name = name;
    if (category !== undefined) skill.category = category;
    if (description !== undefined) skill.description = description;

    // Handle thumbnail update
    if (req.file) {
      // Delete old thumbnail if exists
      if (skill.thumbnail?.publicId) {
        await deleteResource(skill.thumbnail.publicId, 'image');
      }

      const upload = await uploadBuffer(req.file.buffer, {
        folder: 'skills',
        resource_type: 'image',
      });
      skill.thumbnail = {
        url: upload.secure_url,
        publicId: upload.public_id,
      };
    }

    await skill.save();

    const populatedSkill = await Skill.findById(skill._id)
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Skill updated successfully',
      data: populatedSkill,
    });
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating skill',
      error: error.message,
    });
  }
};

// Delete a skill
exports.deleteSkill = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found',
      });
    }

    // Delete thumbnail from Cloudinary
    if (skill.thumbnail?.publicId) {
      await deleteResource(skill.thumbnail.publicId, 'image');
    }

    await Skill.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Skill deleted successfully',
    });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting skill',
      error: error.message,
    });
  }
};


