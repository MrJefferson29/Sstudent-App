const LiveSession = require('../models/LiveSession');
const Department = require('../models/Department');
const User = require('../models/User');

const getRequestUser = async (userId) => {
  if (!userId) return null;
  return User.findById(userId).select('role department name');
};

const ensureAdmin = async (userId, res) => {
  const user = await getRequestUser(userId);
  if (!user) {
    res.status(401).json({ success: false, message: 'User not found' });
    return null;
  }
  if (user.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Admin access required' });
    return null;
  }
  return user;
};

const ensureDepartmentAccess = (user, session) => {
  if (!session) {
    return { allowed: false, code: 404, message: 'Live session not found' };
  }
  if (user.role === 'admin') {
    return { allowed: true };
  }
  if (!user.department || user.department.toString() !== session.department.toString()) {
    return { allowed: false, code: 403, message: 'You cannot access this live session' };
  }
  return { allowed: true };
};

exports.createLiveSession = async (req, res) => {
  try {
    const admin = await ensureAdmin(req.userId, res);
    if (!admin) return;

    const {
      department,
      courseTitle,
      courseCode,
      description,
      lecturer,
      youtubeUrl,
      scheduledAt,
    } = req.body;

    if (!department || !courseTitle || !courseCode || !lecturer || !youtubeUrl) {
      return res.status(400).json({
        success: false,
        message: 'department, courseTitle, courseCode, lecturer and youtubeUrl are required',
      });
    }

    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    const session = await LiveSession.create({
      department,
      courseTitle,
      courseCode,
      description,
      lecturer,
      youtubeUrl,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : Date.now(),
      createdBy: admin._id,
    });

    const populated = await LiveSession.findById(session._id)
      .populate('department', 'name')
      .lean();

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    console.error('Create live session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create live session',
      error: error.message,
    });
  }
};

exports.getLiveSessions = async (req, res) => {
  try {
    const user = await getRequestUser(req.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const filter = {};
    if (user.role === 'admin') {
      if (req.query.department) {
        filter.department = req.query.department;
      }
    } else {
      if (!user.department) {
        return res.status(403).json({
          success: false,
          message: 'Please complete your profile to access live sessions',
        });
      }
      filter.department = user.department;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    } else if (req.query.active === 'true') {
      filter.status = { $in: ['scheduled', 'live'] };
    }

    const sessions = await LiveSession.find(filter)
      .populate('department', 'name')
      .sort({ status: 1, scheduledAt: 1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error('Get live sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live sessions',
      error: error.message,
    });
  }
};

exports.getLiveSessionById = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id).populate('department', 'name').lean();
    const user = await getRequestUser(req.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const access = ensureDepartmentAccess(user, session);
    if (!access.allowed) {
      return res.status(access.code).json({ success: false, message: access.message });
    }

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Get live session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live session',
      error: error.message,
    });
  }
};

exports.updateLiveSession = async (req, res) => {
  try {
    const admin = await ensureAdmin(req.userId, res);
    if (!admin) return;

    const session = await LiveSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Live session not found' });
    }

    const {
      department,
      courseTitle,
      courseCode,
      description,
      lecturer,
      youtubeUrl,
      scheduledAt,
      status,
    } = req.body;

    if (department && department !== session.department.toString()) {
      const dept = await Department.findById(department);
      if (!dept) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }
      session.department = department;
    }

    if (courseTitle !== undefined) session.courseTitle = courseTitle;
    if (courseCode !== undefined) session.courseCode = courseCode;
    if (description !== undefined) session.description = description;
    if (lecturer !== undefined) session.lecturer = lecturer;
    if (youtubeUrl !== undefined) session.youtubeUrl = youtubeUrl;
    if (scheduledAt !== undefined) session.scheduledAt = scheduledAt ? new Date(scheduledAt) : session.scheduledAt;
    if (status && ['scheduled', 'live', 'ended'].includes(status)) {
      session.status = status;
      if (status === 'live') {
        session.startedAt = session.startedAt || new Date();
        session.endedAt = null;
      } else if (status === 'ended') {
        session.endedAt = new Date();
      }
    }

    await session.save();

    const populated = await LiveSession.findById(session._id)
      .populate('department', 'name')
      .lean();

    res.status(200).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    console.error('Update live session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update live session',
      error: error.message,
    });
  }
};

exports.startLiveSession = async (req, res) => {
  try {
    const admin = await ensureAdmin(req.userId, res);
    if (!admin) return;

    const session = await LiveSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Live session not found' });
    }

    session.status = 'live';
    session.startedAt = new Date();
    session.endedAt = null;
    await session.save();

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Start live session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start live session',
      error: error.message,
    });
  }
};

exports.endLiveSession = async (req, res) => {
  try {
    const admin = await ensureAdmin(req.userId, res);
    if (!admin) return;

    const session = await LiveSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Live session not found' });
    }

    session.status = 'ended';
    session.endedAt = new Date();
    await session.save();

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('End live session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end live session',
      error: error.message,
    });
  }
};

exports.deleteLiveSession = async (req, res) => {
  try {
    const admin = await ensureAdmin(req.userId, res);
    if (!admin) return;

    const session = await LiveSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Live session not found' });
    }

    await LiveSession.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Live session deleted',
    });
  } catch (error) {
    console.error('Delete live session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete live session',
      error: error.message,
    });
  }
};


