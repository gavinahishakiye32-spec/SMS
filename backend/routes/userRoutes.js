const express = require('express');
const router = express.Router();
const { getUsers, createUser, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.route('/')
  .get(protect, authorizeRoles('superadmin', 'schooladmin'), getUsers)
  .post(protect, authorizeRoles('superadmin', 'schooladmin'), createUser);

router.route('/:id')
  .get(protect, authorizeRoles('superadmin', 'schooladmin'), getUserById)
  .put(protect, authorizeRoles('superadmin', 'schooladmin'), updateUser)
  .delete(protect, authorizeRoles('superadmin', 'schooladmin'), deleteUser);

module.exports = router;
