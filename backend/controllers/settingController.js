const asyncHandler = require('express-async-handler');
const SchoolSetting = require('../models/SchoolSetting');

const getSettings = asyncHandler(async (req, res) => {
  let settings = await SchoolSetting.findOne();
  if (!settings) {
    settings = await SchoolSetting.create({});
  }
  return res.json({ success: true, data: settings });
});

const updateSettings = asyncHandler(async (req, res) => {
  const { schoolName } = req.body;
  const logo = req.file ? req.file.path : undefined;
  let settings = await SchoolSetting.findOne();
  if (!settings) {
    settings = new SchoolSetting();
  }
  if (schoolName !== undefined) settings.schoolName = schoolName;
  if (logo !== undefined) settings.logo = logo;
  await settings.save();
  return res.json({ success: true, message: 'Settings updated', data: settings });
});

module.exports = { getSettings, updateSettings };
