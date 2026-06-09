const express = require('express');
const router = express.Router();
const { getSubjects, createSubject, getSubjectById, updateSubject, deleteSubject, assignTeacher } = require('../controllers/subjectController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.route('/')
  .get(protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), getSubjects)
  .post(protect, authorizeRoles('superadmin', 'schooladmin'), createSubject);

router.post('/:id/assign-teacher', protect, authorizeRoles('superadmin', 'schooladmin'), assignTeacher);

router.route('/:id')
  .get(protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), getSubjectById)
  .put(protect, authorizeRoles('superadmin', 'schooladmin'), updateSubject)
  .delete(protect, authorizeRoles('superadmin', 'schooladmin'), deleteSubject);

module.exports = router;
