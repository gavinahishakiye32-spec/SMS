const express = require('express');
const router = express.Router();
const { getClasses, createClass, getClassById, updateClass, deleteClass, getClassStudents, getClassPerformance } = require('../controllers/classController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.route('/')
  .get(protect, getClasses)
  .post(protect, authorizeRoles('superadmin', 'schooladmin'), createClass);

router.get('/:id/students', protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), getClassStudents);
router.get('/:id/performance', protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), getClassPerformance);

router.route('/:id')
  .get(protect, getClassById)
  .put(protect, authorizeRoles('superadmin', 'schooladmin'), updateClass)
  .delete(protect, authorizeRoles('superadmin', 'schooladmin'), deleteClass);

module.exports = router;
