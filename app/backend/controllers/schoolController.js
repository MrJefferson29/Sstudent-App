const School = require('../models/School');
const Department = require('../models/Department');

// Create a new school
exports.createSchool = async (req, res) => {
  try {
    const { name, description, location } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'School name is required',
      });
    }

    // Check if school already exists
    const existingSchool = await School.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingSchool) {
      return res.status(400).json({
        success: false,
        message: 'School with this name already exists',
      });
    }

    const school = await School.create({
      name,
      description,
      location,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      message: 'School created successfully',
      data: school,
    });
  } catch (error) {
    console.error('Create school error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating school',
      error: error.message,
    });
  }
};

// Get all schools
exports.getAllSchools = async (req, res) => {
  try {
    const schools = await School.find()
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: schools.length,
      data: schools,
    });
  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching schools',
      error: error.message,
    });
  }
};

// Get a single school by ID with departments
exports.getSchoolById = async (req, res) => {
  try {
    const school = await School.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    // Get departments for this school
    const departments = await Department.find({ school: school._id })
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: {
        school,
        departments,
      },
    });
  } catch (error) {
    console.error('Get school error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching school',
      error: error.message,
    });
  }
};

// Update a school
exports.updateSchool = async (req, res) => {
  try {
    const { name, description, location } = req.body;
    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    // Check if name is being changed and if it conflicts with existing school
    if (name && name !== school.name) {
      const existingSchool = await School.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (existingSchool) {
        return res.status(400).json({
          success: false,
          message: 'School with this name already exists',
        });
      }
    }

    if (name) school.name = name;
    if (description !== undefined) school.description = description;
    if (location !== undefined) school.location = location;

    await school.save();

    res.status(200).json({
      success: true,
      message: 'School updated successfully',
      data: school,
    });
  } catch (error) {
    console.error('Update school error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating school',
      error: error.message,
    });
  }
};

// Delete a school
exports.deleteSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    // Check if school has departments
    const departmentsCount = await Department.countDocuments({ school: school._id });
    if (departmentsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete school with existing departments. Please delete departments first.',
      });
    }

    await School.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'School deleted successfully',
    });
  } catch (error) {
    console.error('Delete school error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting school',
      error: error.message,
    });
  }
};

