const express = require('express');
const router = express.Router();
const { getParents, createParent, getParentById, updateParent, deleteParent } = require('../controllers/parentController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.route('/')
  .get(protect, authorizeRoles('superadmin', 'schooladmin'), getParents)
  .post(protect, authorizeRoles('superadmin', 'schooladmin'), createParent);

router.route('/:id')
  .get(protect, authorizeRoles('superadmin', 'schooladmin'), getParentById)
  .put(protect, authorizeRoles('superadmin', 'schooladmin'), updateParent)
  .delete(protect, authorizeRoles('superadmin', 'schooladmin'), deleteParent);

module.exports = router;
