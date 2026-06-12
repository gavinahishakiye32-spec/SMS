const express = require('express');
const router = express.Router();
const { getTeachers, createTeacher, getTeacherById, updateTeacher, deleteTeacher, getTeacherSubjects } = require('../controllers/teacherController');
const { protect, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
  .get(protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), getTeachers)
  .post(protect, authorizeRoles('superadmin', 'schooladmin'), upload.single('profilePhoto'), createTeacher);

router.get('/:id/subjects', protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), getTeacherSubjects);

router.route('/:id')
  .get(protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), getTeacherById)
  .put(protect, authorizeRoles('superadmin', 'schooladmin'), upload.single('profilePhoto'), updateTeacher)
  .delete(protect, authorizeRoles('superadmin', 'schooladmin'), deleteTeacher);

module.exports = router;
