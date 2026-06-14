const asyncHandler = require('express-async-handler');
const Section = require('../models/Section');
const Student = require('../models/Student');

const getSections = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  let query = {};
  if (req.query.level) query.level = req.query.level;
  const total = await Section.countDocuments(query);
  const sections = await Section.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ name: 1 });
  return res.json({
    success: true,
    data: sections,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

const createSection = asyncHandler(async (req, res) => {
  const { name, level } = req.body;
  if (!name || !level) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name and level',
    });
  }
  if (!['O-Level', 'A-Level'].includes(level)) {
    return res.status(400).json({
      success: false,
      message: 'Level must be O-Level or A-Level',
    });
  }
  const exists = await Section.findOne({ name, level });
  if (exists) {
    return res.status(409).json({
      success: false,
      message: 'Section already exists for this level',
    });
  }
  const section = await Section.create({ name, level });
  return res.status(201).json({
    success: true,
    message: 'Section created successfully',
    data: section,
  });
});

const getSectionById = asyncHandler(async (req, res) => {
  const section = await Section.findById(req.params.id);
  if (!section) {
    return res.status(404).json({
      success: false,
      message: 'Section not found',
    });
  }
  return res.json({ success: true, data: section });
});

const updateSection = asyncHandler(async (req, res) => {
  const section = await Section.findById(req.params.id);
  if (!section) {
    return res.status(404).json({
      success: false,
      message: 'Section not found',
    });
  }
  if (req.body.name) section.name = req.body.name;
  if (req.body.level) section.level = req.body.level;
  const updated = await section.save();
  return res.json({
    success: true,
    message: 'Section updated successfully',
    data: updated,
  });
});

const deleteSection = asyncHandler(async (req, res) => {
  const section = await Section.findById(req.params.id);
  if (!section) {
    return res.status(404).json({
      success: false,
      message: 'Section not found',
    });
  }
  await Student.updateMany({ sectionId: section._id }, { sectionId: null });
  await Section.deleteOne({ _id: section._id });
  return res.json({
    success: true,
    message: 'Section deleted successfully',
  });
});

module.exports = {
  getSections,
  createSection,
  getSectionById,
  updateSection,
  deleteSection,
};
