const express = require('express');
const router = express.Router();
const {
  getStudents, createStudent, getStudentById,
  updateStudent, deleteStudent, getStudentReport, getStudentRanking,
} = require('../controllers/studentController');
const { protect, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
  .get(protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), getStudents)
  .post(protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), upload.single('profilePhoto'), createStudent);

router.get('/:id/report', protect, authorizeRoles('superadmin', 'schooladmin', 'teacher', 'student'), getStudentReport);
router.get('/:id/ranking', protect, authorizeRoles('superadmin', 'schooladmin', 'teacher', 'student'), getStudentRanking);

router.route('/:id')
  .get(protect, authorizeRoles('superadmin', 'schooladmin', 'teacher', 'student'), getStudentById)
  .put(protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), upload.single('profilePhoto'), updateStudent)
  .delete(protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), deleteStudent);

module.exports = router;
