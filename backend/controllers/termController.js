const asyncHandler = require('express-async-handler');
const Term = require('../models/Term');
const Mark = require('../models/Mark');
const Report = require('../models/Report');

const getTerms = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  let query = {};
  if (req.query.academicYearId) query.academicYearId = req.query.academicYearId;
  const total = await Term.countDocuments(query);
  const terms = await Term.find(query)
    .populate('academicYearId', 'year')
    .skip(skip)
    .limit(limit)
    .sort({ name: 1 });
  return res.json({
    success: true,
    data: terms,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

const createTerm = asyncHandler(async (req, res) => {
  const { name, academicYearId, startDate, endDate } = req.body;
  if (!name || !academicYearId || !startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, academicYearId, startDate, and endDate',
    });
  }
  const exists = await Term.findOne({ name, academicYearId });
  if (exists) {
    return res.status(409).json({
      success: false,
      message: 'Term already exists for this academic year',
    });
  }
  const term = await Term.create({ name, academicYearId, startDate, endDate });
  return res.status(201).json({
    success: true,
    message: 'Term created successfully',
    data: term,
  });
});

const getTermById = asyncHandler(async (req, res) => {
  const term = await Term.findById(req.params.id).populate('academicYearId', 'year');
  if (!term) {
    return res.status(404).json({
      success: false,
      message: 'Term not found',
    });
  }
  return res.json({ success: true, data: term });
});

const updateTerm = asyncHandler(async (req, res) => {
  const term = await Term.findById(req.params.id);
  if (!term) {
    return res.status(404).json({
      success: false,
      message: 'Term not found',
    });
  }
  if (req.body.name) term.name = req.body.name;
  if (req.body.academicYearId) term.academicYearId = req.body.academicYearId;
  if (req.body.startDate) term.startDate = req.body.startDate;
  if (req.body.endDate) term.endDate = req.body.endDate;
  if (req.body.isActive !== undefined) term.isActive = req.body.isActive;
  const updated = await term.save();
  return res.json({
    success: true,
    message: 'Term updated successfully',
    data: updated,
  });
});

const deleteTerm = asyncHandler(async (req, res) => {
  const term = await Term.findById(req.params.id);
  if (!term) {
    return res.status(404).json({
      success: false,
      message: 'Term not found',
    });
  }
  await Mark.deleteMany({ termId: term._id });
  await Report.deleteMany({ termId: term._id });
  await Term.deleteOne({ _id: term._id });
  return res.json({
    success: true,
    message: 'Term deleted successfully',
  });
});

module.exports = {
  getTerms,
  createTerm,
  getTermById,
  updateTerm,
  deleteTerm,
};
