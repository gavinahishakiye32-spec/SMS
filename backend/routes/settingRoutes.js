const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const { protect, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
  .get(protect, getSettings)
  .put(protect, authorizeRoles('superadmin', 'schooladmin'), upload.single('logo'), updateSettings);

module.exports = router;
