const Department = require('../models/Department');
const School = require('../models/School');
const Question = require('../models/Question');
const Course = require('../models/Course');
const Concours = require('../models/Concours');

// Create a new department
exports.createDepartment = async (req, res) => {
  try {
    const { name, description, school } = req.body;
    const userId = req.userId;

    if (!name || !school) {
      return res.status(400).json({
        success: false,
        message: 'Department name and school are required',
      });
    }

    // Verify school exists
    const schoolExists = await School.findById(school);
    if (!schoolExists) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    // Check if department already exists in this school
    const existingDepartment = await Department.findOne({
      school,
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    });
    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name already exists in this school',
      });
    }

    const department = await Department.create({
      name,
      description,
      school,
      createdBy: userId,
    });

    const populatedDepartment = await Department.findById(department._id)
      .populate('school', 'name')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: populatedDepartment,
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating department',
      error: error.message,
    });
  }
};

// Get all departments (optionally filtered by school)
exports.getAllDepartments = async (req, res) => {
  try {
    const { school } = req.query;
    const filter = {};
    if (school) filter.school = school;

    const departments = await Department.find(filter)
      .populate('school', 'name location')
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments,
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching departments',
      error: error.message,
    });
  }
};

// Get a single department by ID with related data
exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('school', 'name location')
      .populate('createdBy', 'name email');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    // Get counts for related data
    const [questionsCount, coursesCount, concoursCount] = await Promise.all([
      Question.countDocuments({ department: department._id }),
      Course.countDocuments({ department: department._id }),
      Concours.countDocuments({ department: department._id }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        department,
        counts: {
          questions: questionsCount,
          courses: coursesCount,
          concours: concoursCount,
        },
      },
    });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching department',
      error: error.message,
    });
  }
};

// Update a department
exports.updateDepartment = async (req, res) => {
  try {
    const { name, description, school } = req.body;
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    // If school is being changed, verify it exists
    if (school && school !== department.school.toString()) {
      const schoolExists = await School.findById(school);
      if (!schoolExists) {
        return res.status(404).json({
          success: false,
          message: 'School not found',
        });
      }
    }

    // Check if name is being changed and if it conflicts
    if (name && name !== department.name) {
      const existingDepartment = await Department.findOne({
        school: school || department.school,
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: department._id },
      });
      if (existingDepartment) {
        return res.status(400).json({
          success: false,
          message: 'Department with this name already exists in this school',
        });
      }
    }

    if (name) department.name = name;
    if (description !== undefined) department.description = description;
    if (school) department.school = school;

    await department.save();

    const populatedDepartment = await Department.findById(department._id)
      .populate('school', 'name')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: populatedDepartment,
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating department',
      error: error.message,
    });
  }
};

// Delete a department
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found',
      });
    }

    // Check if department has related data
    const [questionsCount, coursesCount, concoursCount] = await Promise.all([
      Question.countDocuments({ department: department._id }),
      Course.countDocuments({ department: department._id }),
      Concours.countDocuments({ department: department._id }),
    ]);

    if (questionsCount > 0 || coursesCount > 0 || concoursCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department with existing data. Please delete ${questionsCount} questions, ${coursesCount} courses, and ${concoursCount} concours first.`,
      });
    }

    await Department.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting department',
      error: error.message,
    });
  }
};

