const express = require('express');
const router = express.Router();
const { getAcademicYears, createAcademicYear, getAcademicYearById, updateAcademicYear, deleteAcademicYear, activateAcademicYear } = require('../controllers/academicYearController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.route('/')
  .get(protect, getAcademicYears)
  .post(protect, authorizeRoles('superadmin', 'schooladmin'), createAcademicYear);

router.put('/:id/activate', protect, authorizeRoles('superadmin', 'schooladmin'), activateAcademicYear);

router.route('/:id')
  .get(protect, getAcademicYearById)
  .put(protect, authorizeRoles('superadmin', 'schooladmin'), updateAcademicYear)
  .delete(protect, authorizeRoles('superadmin', 'schooladmin'), deleteAcademicYear);

module.exports = router;
