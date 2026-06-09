const asyncHandler = require('express-async-handler');
const Section = require('../models/Section');
const Student = require('../models/Student');
const Class = require('../models/Class');

const getSections = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  let query = {};
  if (req.query.classId) query.classId = req.query.classId;
  if (req.query.level) {
    const classes = await Class.find({ level: req.query.level }).select('_id');
    if (!req.query.classId) query.classId = { $in: classes.map(c => c._id) };
  }
  const total = await Section.countDocuments(query);
  const sections = await Section.find(query)
    .populate('classId', 'name level')
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
  const { name, classId } = req.body;
  if (!name || !classId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name and classId',
    });
  }
  const exists = await Section.findOne({ name, classId });
  if (exists) {
    return res.status(409).json({
      success: false,
      message: 'Section already exists for this class',
    });
  }
  const section = await Section.create({ name, classId });
  return res.status(201).json({
    success: true,
    message: 'Section created successfully',
    data: section,
  });
});

const getSectionById = asyncHandler(async (req, res) => {
  const section = await Section.findById(req.params.id).populate('classId', 'name level');
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
  if (req.body.classId) section.classId = req.body.classId;
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
