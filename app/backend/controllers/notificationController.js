const Notification = require('../models/Notification');
const User = require('../models/User');
const { uploadBuffer, deleteResource } = require('../utils/storage');

// Helper function to ensure admin access
const ensureAdmin = async (userId) => {
  const user = await User.findById(userId);
  if (!user || user.role !== 'admin') {
    const error = new Error('Only admins can manage notifications');
    error.statusCode = 403;
    throw error;
  }
  return user;
};

// Create a new notification
exports.createNotification = async (req, res) => {
  try {
    const { title, description, mediaType } = req.body; // mediaType: 'thumbnail' or 'video'
    const userId = req.userId;

    // Ensure user is admin
    await ensureAdmin(userId);

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required',
      });
    }

    if (!mediaType || !['thumbnail', 'video'].includes(mediaType)) {
      return res.status(400).json({
        success: false,
        message: 'Media type must be either "thumbnail" or "video"',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Media file (thumbnail or video) is required',
      });
    }

    let thumbnail = null;
    let video = null;

    if (mediaType === 'thumbnail') {
      // Upload thumbnail image
      const upload = await uploadBuffer(req.file.buffer, {
        folder: 'notifications',
        resource_type: 'image',
        contentType: req.file.mimetype,
      });
      thumbnail = {
        url: upload.secure_url || upload.url,
        publicId: upload.public_id,
      };
    } else if (mediaType === 'video') {
      // Upload video
      const upload = await uploadBuffer(req.file.buffer, {
        folder: 'notifications',
        resource_type: 'video',
        contentType: req.file.mimetype,
      });
      video = {
        url: upload.secure_url || upload.url,
        publicId: upload.public_id,
      };
    }

    const notification = await Notification.create({
      title,
      description,
      thumbnail,
      video,
      createdBy: userId,
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: populatedNotification,
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error creating notification',
      error: error.message,
    });
  }
};

// Get all notifications
exports.getAllNotifications = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const notifications = await Notification.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message,
    });
  }
};

// Get a single notification by ID
exports.getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notification',
      error: error.message,
    });
  }
};

// Update a notification
exports.updateNotification = async (req, res) => {
  try {
    const { title, description, mediaType } = req.body;
    const userId = req.userId;

    // Ensure user is admin
    await ensureAdmin(userId);

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Update basic fields
    if (title) notification.title = title;
    if (description) notification.description = description;

    // Handle media update if provided
    if (req.file && mediaType) {
      // Delete old media
      if (notification.thumbnail && notification.thumbnail.publicId) {
        try {
          await deleteResource(notification.thumbnail.publicId);
        } catch (err) {
          console.error('Error deleting old thumbnail:', err);
        }
      }
      if (notification.video && notification.video.publicId) {
        try {
          await deleteResource(notification.video.publicId);
        } catch (err) {
          console.error('Error deleting old video:', err);
        }
      }

      // Upload new media
      if (mediaType === 'thumbnail') {
        const upload = await uploadBuffer(req.file.buffer, {
          folder: 'notifications',
          resource_type: 'image',
          contentType: req.file.mimetype,
        });
        notification.thumbnail = {
          url: upload.secure_url || upload.url,
          publicId: upload.public_id,
        };
        notification.video = { url: null, publicId: null };
      } else if (mediaType === 'video') {
        const upload = await uploadBuffer(req.file.buffer, {
          folder: 'notifications',
          resource_type: 'video',
          contentType: req.file.mimetype,
        });
        notification.video = {
          url: upload.secure_url || upload.url,
          publicId: upload.public_id,
        };
        notification.thumbnail = { url: null, publicId: null };
      }
    }

    await notification.save();

    const populatedNotification = await Notification.findById(notification._id)
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Notification updated successfully',
      data: populatedNotification,
    });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error updating notification',
      error: error.message,
    });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.userId;

    // Ensure user is admin
    await ensureAdmin(userId);

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Delete media files
    if (notification.thumbnail && notification.thumbnail.publicId) {
      try {
        await deleteResource(notification.thumbnail.publicId);
      } catch (err) {
        console.error('Error deleting thumbnail:', err);
      }
    }
    if (notification.video && notification.video.publicId) {
      try {
        await deleteResource(notification.video.publicId);
      } catch (err) {
        console.error('Error deleting video:', err);
      }
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error deleting notification',
      error: error.message,
    });
  }
};

