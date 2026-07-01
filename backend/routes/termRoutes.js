const express = require('express');
const router = express.Router();
const { getTerms, createTerm, getTermById, updateTerm, deleteTerm, getActiveTerm } = require('../controllers/termController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/active', protect, getActiveTerm);

router.route('/')
  .get(protect, getTerms)
  .post(protect, authorizeRoles('superadmin', 'schooladmin'), createTerm);

router.route('/:id')
  .get(protect, getTermById)
  .put(protect, authorizeRoles('superadmin', 'schooladmin'), updateTerm)
  .delete(protect, authorizeRoles('superadmin', 'schooladmin'), deleteTerm);

module.exports = router;
