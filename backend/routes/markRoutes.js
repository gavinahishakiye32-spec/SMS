const express = require('express');
const router = express.Router();
const { getMarks, addMarks, getMarkById, updateMarks, deleteMarks, getStudentMarks, getStudentSubjectMarks, getClassMarks } = require('../controllers/markController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.route('/')
  .get(protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), getMarks)
  .post(protect, authorizeRoles('teacher', 'superadmin', 'schooladmin'), addMarks);

router.get('/student/:studentId', protect, authorizeRoles('superadmin', 'schooladmin', 'teacher', 'student'), getStudentMarks);
router.get('/student/:studentId/subject/:subjectId', protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), getStudentSubjectMarks);
router.get('/class/:classId', protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), getClassMarks);

router.route('/:id')
  .get(protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), getMarkById)
  .put(protect, authorizeRoles('teacher', 'superadmin', 'schooladmin'), updateMarks)
  .delete(protect, authorizeRoles('superadmin', 'schooladmin'), deleteMarks);

module.exports = router;
