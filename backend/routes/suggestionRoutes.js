const express = require('express');
const router = express.Router();
const { getSuggestions, createSuggestion, getSuggestionById, updateSuggestion, deleteSuggestion, addComment, updateComment, deleteComment, markAsRead, getUnreadCount, likeSuggestion } = require('../controllers/suggestionController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.route('/')
  .get(protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), getSuggestions)
  .post(protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), createSuggestion);

router.post('/:id/comment', protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), addComment);
router.put('/:id/comment/:commentId', protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), updateComment);
router.delete('/:id/comment/:commentId', protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), deleteComment);
router.post('/:id/like', protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), likeSuggestion);
router.post('/:id/read', protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), markAsRead);
router.get('/unread-count', protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), getUnreadCount);

router.route('/:id')
  .get(protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), getSuggestionById)
  .put(protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), updateSuggestion)
  .delete(protect, authorizeRoles('superadmin', 'schooladmin', 'teacher'), deleteSuggestion);

module.exports = router;
