const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Question = require('../models/Question');
const Solution = require('../models/Solution');
const { uploadBuffer, deleteResource } = require('../utils/cloudinary');

const formatUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  school: user.school,
  department: user.department,
  level: user.level,
  role: user.role,
  profilePicture: user.profilePicture,
  createdAt: user.createdAt,
});

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message,
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, school, department, level } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update fields
    if (name) user.name = name;
    if (school !== undefined) user.school = school;
    if (department !== undefined) user.department = department;
    if (level !== undefined) user.level = level;

    if (req.file) {
      if (user.profilePicturePublicId) {
        await deleteResource(user.profilePicturePublicId, 'image');
      }
      const upload = await uploadBuffer(req.file.buffer, {
        folder: 'profiles',
        resource_type: 'image',
      });
      user.profilePicture = upload.secure_url;
      user.profilePicturePublicId = upload.public_id;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message,
    });
  }
};

// Update password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    // Find user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: error.message,
    });
  }
};

// Get user statistics (contributions)
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.userId;

    // Count user's contributions
    const [questionsCount, solutionsCount] = await Promise.all([
      Question.countDocuments({ uploadedBy: userId }),
      Solution.countDocuments({ uploadedBy: userId }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        questions: questionsCount,
        solutions: solutionsCount,
        total: questionsCount + solutionsCount,
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
      error: error.message,
    });
  }
};

