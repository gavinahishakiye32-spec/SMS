const express = require('express');
const router = express.Router();
const { getSchoolAnalytics, getClassAnalytics, getSubjectAnalytics, getTopStudents, getBottomStudents } = require('../controllers/analyticsController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/school', protect, authorizeRoles('superadmin', 'schooladmin'), getSchoolAnalytics);
router.get('/class/:classId', protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), getClassAnalytics);
router.get('/subject/:subjectId', protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), getSubjectAnalytics);
router.get('/top-students', protect, authorizeRoles('superadmin', 'schooladmin'), getTopStudents);
router.get('/bottom-students', protect, authorizeRoles('superadmin', 'schooladmin'), getBottomStudents);

module.exports = router;
