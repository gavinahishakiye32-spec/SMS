const express = require('express');
const router = express.Router();
const { getStudentReport, searchReports, getClassReport, getSchoolReport, getStudentReportPdf, updateReportRemark } = require('../controllers/reportController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/search', protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), searchReports);
router.get('/student/:studentId', protect, authorizeRoles('superadmin', 'schooladmin', 'teacher', 'student'), getStudentReport);
router.get('/student/:studentId/pdf', protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), getStudentReportPdf);
router.get('/class/:classId', protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), getClassReport);
router.get('/school', protect, authorizeRoles('superadmin', 'schooladmin'), getSchoolReport);
router.put('/:reportId/remark', protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), updateReportRemark);

module.exports = router;
