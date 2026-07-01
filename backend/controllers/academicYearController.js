const asyncHandler = require('express-async-handler');
const AcademicYear = require('../models/AcademicYear');
const Class = require('../models/Class');
const Term = require('../models/Term');
const Student = require('../models/Student');
const Mark = require('../models/Mark');
const Report = require('../models/Report');

const getAcademicYears = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  let query = {};
  if (req.query.isActive) query.isActive = req.query.isActive === 'true';
  const total = await AcademicYear.countDocuments(query);
  const years = await AcademicYear.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ year: -1 });
  return res.json({
    success: true,
    data: years,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

const createAcademicYear = asyncHandler(async (req, res) => {
  const { year } = req.body;
  if (!year) {
    return res.status(400).json({
      success: false,
      message: 'Please provide year',
    });
  }
  const exists = await AcademicYear.findOne({ year });
  if (exists) {
    return res.status(409).json({
      success: false,
      message: 'Academic year already exists',
    });
  }
  const academicYear = await AcademicYear.create({ year });
  return res.status(201).json({
    success: true,
    message: 'Academic year created successfully',
    data: academicYear,
  });
});

const getAcademicYearById = asyncHandler(async (req, res) => {
  const year = await AcademicYear.findById(req.params.id);
  if (!year) {
    return res.status(404).json({
      success: false,
      message: 'Academic year not found',
    });
  }
  return res.json({ success: true, data: year });
});

const updateAcademicYear = asyncHandler(async (req, res) => {
  const year = await AcademicYear.findById(req.params.id);
  if (!year) {
    return res.status(404).json({
      success: false,
      message: 'Academic year not found',
    });
  }
  if (req.body.year) year.year = req.body.year;
  if (req.body.isActive !== undefined) {
    year.isActive = req.body.isActive;
    if (year.isActive) {
      await AcademicYear.updateMany({ _id: { $ne: year._id } }, { isActive: false });
      // Auto-create terms when activating via update
      const termNames = ['Term 1', 'Term 2', 'Term 3'];
      for (const name of termNames) {
        const existing = await Term.findOne({ name, academicYearId: year._id });
        if (!existing) {
          await Term.create({ name, academicYearId: year._id, isActive: false });
        }
      }
    }
  }
  const updated = await year.save();
  return res.json({
    success: true,
    message: 'Academic year updated successfully',
    data: updated,
  });
});

const deleteAcademicYear = asyncHandler(async (req, res) => {
  const year = await AcademicYear.findById(req.params.id);
  if (!year) {
    return res.status(404).json({
      success: false,
      message: 'Academic year not found',
    });
  }
  const [markCount, reportCount, termCount, studentCount, classCount] = await Promise.all([
    Mark.countDocuments({ academicYearId: year._id }),
    Report.countDocuments({ academicYearId: year._id }),
    Term.countDocuments({ academicYearId: year._id }),
    Student.countDocuments({ academicYearId: year._id }),
    Class.countDocuments({ academicYearId: year._id }),
  ]);
  const total = markCount + reportCount + termCount + classCount;
  if (total > 0 && req.query.confirm !== 'true') {
    return res.status(400).json({
      success: false,
      message: `This will permanently delete ${total} record(s) (${markCount} marks, ${reportCount} reports, ${termCount} terms, ${classCount} classes) and unlink ${studentCount} student(s). Set ?confirm=true to proceed.`,
    });
  }
  await Mark.deleteMany({ academicYearId: year._id });
  await Report.deleteMany({ academicYearId: year._id });
  await Term.deleteMany({ academicYearId: year._id });
  await Student.updateMany({ academicYearId: year._id }, { academicYearId: null });
  await Class.updateMany({ academicYearId: year._id }, { $unset: { academicYearId: '' } });
  await AcademicYear.deleteOne({ _id: year._id });
  return res.json({
    success: true,
    message: 'Academic year deleted successfully',
  });
});

const activateAcademicYear = asyncHandler(async (req, res) => {
  const year = await AcademicYear.findById(req.params.id);
  if (!year) {
    return res.status(404).json({
      success: false,
      message: 'Academic year not found',
    });
  }
  await AcademicYear.updateMany({}, { isActive: false });
  year.isActive = true;
  await year.save();

  // Auto-create Term 1, Term 2, Term 3 for this year if they don't exist
  const termNames = ['Term 1', 'Term 2', 'Term 3'];
  for (const name of termNames) {
    const existing = await Term.findOne({ name, academicYearId: year._id });
    if (!existing) {
      await Term.create({ name, academicYearId: year._id, isActive: false });
    }
  }

  // Deactivate all terms globally and activate Term 1 for this year
  await Term.updateMany({}, { isActive: false });
  await Term.updateOne({ name: 'Term 1', academicYearId: year._id }, { isActive: true });

  return res.json({
    success: true,
    message: 'Academic year activated successfully with Term 1, Term 2, and Term 3',
  });
});

const getActiveAcademicYear = asyncHandler(async (req, res) => {
  const year = await AcademicYear.findOne({ isActive: true });
  if (!year) {
    return res.status(404).json({ success: false, message: 'No active academic year found' });
  }
  return res.json({ success: true, data: year });
});

module.exports = {
  getAcademicYears,
  createAcademicYear,
  getAcademicYearById,
  updateAcademicYear,
  deleteAcademicYear,
  activateAcademicYear,
  getActiveAcademicYear,
};
