const Course = require('../models/Course');
const Department = require('../models/Department');
const { uploadBuffer, deleteResource } = require('../utils/cloudinary');

// Create a new course
exports.createCourse = async (req, res) => {
  try {
    const { title, code, description, level, department, instructor } = req.body;
    const userId = req.userId;

    if (!title || !department) {
      return res.status(400).json({
        success: false,
        message: 'Course title and department are required',
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

    let thumbnail = null;
    if (req.file) {
      const upload = await uploadBuffer(req.file.buffer, {
        folder: 'courses',
        resource_type: 'image',
      });
      thumbnail = {
        url: upload.secure_url,
        publicId: upload.public_id,
      };
    }

    const course = await Course.create({
      title,
      code,
      description,
      level,
      department,
      instructor,
      thumbnail,
      createdBy: userId,
    });

    const populatedCourse = await Course.findById(course._id)
      .populate('department', 'name')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: populatedCourse,
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating course',
      error: error.message,
    });
  }
};

// Get all courses (optionally filtered by department)
exports.getAllCourses = async (req, res) => {
  try {
    const { department, level } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (level) filter.level = level;

    const courses = await Course.find(filter)
      .populate('department', 'name school')
      .populate('department.school', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message,
    });
  }
};

// Get a single course by ID
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('department', 'name school')
      .populate('department.school', 'name')
      .populate('createdBy', 'name email');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course',
      error: error.message,
    });
  }
};

// Update a course
exports.updateCourse = async (req, res) => {
  try {
    const { title, code, description, level, department, instructor } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // If department is being changed, verify it exists
    if (department && department !== course.department.toString()) {
      const departmentExists = await Department.findById(department);
      if (!departmentExists) {
        return res.status(404).json({
          success: false,
          message: 'Department not found',
        });
      }
    }

    if (title) course.title = title;
    if (code !== undefined) course.code = code;
    if (description !== undefined) course.description = description;
    if (level !== undefined) course.level = level;
    if (department) course.department = department;
    if (instructor !== undefined) course.instructor = instructor;

    // Handle thumbnail update
    if (req.file) {
      // Delete old thumbnail if exists
      if (course.thumbnail?.publicId) {
        await deleteResource(course.thumbnail.publicId, 'image');
      }

      const upload = await uploadBuffer(req.file.buffer, {
        folder: 'courses',
        resource_type: 'image',
      });
      course.thumbnail = {
        url: upload.secure_url,
        publicId: upload.public_id,
      };
    }

    await course.save();

    const populatedCourse = await Course.findById(course._id)
      .populate('department', 'name')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: populatedCourse,
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating course',
      error: error.message,
    });
  }
};

// Delete a course
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Delete thumbnail from Cloudinary
    if (course.thumbnail?.publicId) {
      await deleteResource(course.thumbnail.publicId, 'image');
    }

    await Course.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting course',
      error: error.message,
    });
  }
};

