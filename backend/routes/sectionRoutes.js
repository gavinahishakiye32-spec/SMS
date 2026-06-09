const express = require('express');
const router = express.Router();
const { getSections, createSection, getSectionById, updateSection, deleteSection } = require('../controllers/sectionController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.route('/')
  .get(protect, getSections)
  .post(protect, authorizeRoles('superadmin', 'schooladmin'), createSection);

router.route('/:id')
  .get(protect, getSectionById)
  .put(protect, authorizeRoles('superadmin', 'schooladmin'), updateSection)
  .delete(protect, authorizeRoles('superadmin', 'schooladmin'), deleteSection);

module.exports = router;
