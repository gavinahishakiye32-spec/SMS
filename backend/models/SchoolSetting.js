const mongoose = require('mongoose');

const schoolSettingSchema = mongoose.Schema({
  schoolName: { type: String, default: 'School Management System' },
  logo: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('SchoolSetting', schoolSettingSchema);
