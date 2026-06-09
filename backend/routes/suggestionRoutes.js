const express = require('express');
const router = express.Router();
const { getSuggestions, createSuggestion, getSuggestionById, updateSuggestion, deleteSuggestion, addComment, likeSuggestion } = require('../controllers/suggestionController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.route('/')
  .get(protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), getSuggestions)
  .post(protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), createSuggestion);

router.post('/:id/comment', protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), addComment);
router.post('/:id/like', protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), likeSuggestion);

router.route('/:id')
  .get(protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), getSuggestionById)
  .put(protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), updateSuggestion)
  .delete(protect, authorizeRoles('superadmin', 'schooladmin'), deleteSuggestion);

module.exports = router;
