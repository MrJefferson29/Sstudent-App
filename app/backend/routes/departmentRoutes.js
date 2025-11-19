const express = require('express');
const router = express.Router();
const {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getAllDepartments);
router.get('/:id', getDepartmentById);

// Protected admin routes
router.post('/', protect, createDepartment);
router.put('/:id', protect, updateDepartment);
router.delete('/:id', protect, deleteDepartment);

module.exports = router;

