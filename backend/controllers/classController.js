const asyncHandler = require('express-async-handler');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Section = require('../models/Section');
const Mark = require('../models/Mark');
const Report = require('../models/Report');
const Teacher = require('../models/Teacher');

const getClasses = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  let query = {};
  if (req.query.level) query.level = req.query.level;
  if (req.query.search) {
    query.name = new RegExp(req.query.search, 'i');
  }
  const total = await Class.countDocuments(query);
  const classes = await Class.find(query)
    .populate('academicYearId', 'year')
    .skip(skip)
    .limit(limit)
    .sort({ name: 1 });
  return res.json({
    success: true,
    data: classes,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

const createClass = asyncHandler(async (req, res) => {
  const { name, level, academicYearId } = req.body;
  if (!name || !level) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name and level',
    });
  }
  const exists = await Class.findOne({ name, academicYearId });
  if (exists) {
    return res.status(409).json({
      success: false,
      message: 'Class already exists for this academic year',
    });
  }
  const classItem = await Class.create({ name, level, academicYearId });
  return res.status(201).json({
    success: true,
    message: 'Class created successfully',
    data: classItem,
  });
});

const getClassById = asyncHandler(async (req, res) => {
  const classItem = await Class.findById(req.params.id)
    .populate('academicYearId', 'year');
  if (!classItem) {
    return res.status(404).json({
      success: false,
      message: 'Class not found',
    });
  }
  return res.json({ success: true, data: classItem });
});

const updateClass = asyncHandler(async (req, res) => {
  const classItem = await Class.findById(req.params.id);
  if (!classItem) {
    return res.status(404).json({
      success: false,
      message: 'Class not found',
    });
  }
  if (req.body.name) classItem.name = req.body.name;
  if (req.body.level) classItem.level = req.body.level;
  if (req.body.academicYearId) classItem.academicYearId = req.body.academicYearId;
  const updated = await classItem.save();
  return res.json({
    success: true,
    message: 'Class updated successfully',
    data: updated,
  });
});

const deleteClass = asyncHandler(async (req, res) => {
  const classItem = await Class.findById(req.params.id);
  if (!classItem) {
    return res.status(404).json({
      success: false,
      message: 'Class not found',
    });
  }
  await Mark.deleteMany({ classId: classItem._id });
  await Report.deleteMany({ classId: classItem._id });
  await Section.deleteMany({ classId: classItem._id });
  await Student.updateMany({ classId: classItem._id }, { classId: null, sectionId: null });
  await Class.deleteOne({ _id: classItem._id });
  return res.json({
    success: true,
    message: 'Class deleted successfully',
  });
});

const getClassStudents = asyncHandler(async (req, res) => {
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user._id }).populate({ path: 'subjectIds', select: 'classIds' });
    if (teacher) {
      const classIdSet = new Set();
      for (const subject of teacher.subjectIds) {
        for (const cid of subject.classIds) classIdSet.add(cid.toString());
      }
      if (!classIdSet.has(req.params.id.toString())) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view students in this class',
        });
      }
    }
  }
  const students = await Student.find({ classId: req.params.id })
    .populate('sectionId', 'name')
    .populate('academicYearId', 'year')
    .limit(200)
    .lean();
  return res.json({ success: true, data: students });
});

const getClassPerformance = asyncHandler(async (req, res) => {
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user._id }).populate({ path: 'subjectIds', select: 'classIds' });
    if (teacher) {
      const classIdSet = new Set();
      for (const subject of teacher.subjectIds) {
        for (const cid of subject.classIds) classIdSet.add(cid.toString());
      }
      if (!classIdSet.has(req.params.id.toString())) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view performance for this class',
        });
      }
    }
  }
  const { termId } = req.query;
  const classId = req.params.id;
  let match = { classId };
  if (termId) match.termId = termId;
  const reports = await Report.find(match)
    .populate('studentId', 'firstName lastName studentCode')
    .sort({ overallAverage: -1 })
    .lean();
  const totalStudents = reports.length;
  const passed = reports.filter((r) => r.remarks === 'Pass').length;
  const failed = reports.filter((r) => r.remarks === 'Fail').length;
  const classAverage = totalStudents > 0
    ? reports.reduce((sum, r) => sum + r.overallAverage, 0) / totalStudents
    : 0;

  let markMatch = { classId };
  if (termId) markMatch.termId = termId;
  const subjectAverages = await Mark.aggregate([
    { $match: markMatch },
    { $group: { _id: '$subjectId', avg: { $avg: '$subjectAverage' } } },
    { $lookup: { from: 'subjects', localField: '_id', foreignField: '_id', as: 'subject' } },
    { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
    { $project: { subject: '$subject.name', average: { $round: ['$avg', 2] } } },
  ]);

  return res.json({
    success: true,
    data: {
      totalStudents,
      passed,
      failed,
      passRate: totalStudents > 0 ? Math.round((passed / totalStudents) * 100 * 100) / 100 : 0,
      failRate: totalStudents > 0 ? Math.round((failed / totalStudents) * 100 * 100) / 100 : 0,
      classAverage: Math.round(classAverage * 100) / 100,
      rankings: reports.map((r, i) => ({
        rank: i + 1,
        student: r.studentId,
        overallAverage: r.overallAverage,
        grade: r.grade,
        remarks: r.remarks,
      })),
      subjectPerformance: subjectAverages,
    },
  });
});

module.exports = {
  getClasses,
  createClass,
  getClassById,
  updateClass,
  deleteClass,
  getClassStudents,
  getClassPerformance,
};
