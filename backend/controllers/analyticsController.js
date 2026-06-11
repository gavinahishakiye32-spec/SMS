const asyncHandler = require('express-async-handler');
const Report = require('../models/Report');
const Mark = require('../models/Mark');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');

const getSchoolAnalytics = asyncHandler(async (req, res) => {
  const { termId, academicYearId } = req.query;
  let match = {};
  if (termId) match.termId = termId;
  if (academicYearId) match.academicYearId = academicYearId;
  const reports = await Report.find(match).lean();
  const totalStudents = await Student.countDocuments(academicYearId ? { academicYearId } : {});
  const totalTeachers = await Teacher.countDocuments({});
  const totalClasses = await Class.countDocuments(academicYearId ? { academicYearId } : {});
  const avgPerformance = reports.length > 0
    ? reports.reduce((sum, r) => sum + r.overallAverage, 0) / reports.length
    : 0;
  const gradeDistribution = { Excellent: 0, 'V.Good': 0, Good: 0, 'F.Good': 0, Tried: 0, Improve: 0, Failed: 0 };
  reports.forEach((r) => {
    if (gradeDistribution[r.grade] !== undefined) gradeDistribution[r.grade]++;
  });
  const passed = reports.filter((r) => r.remarks === 'Pass').length;
  const failed = reports.filter((r) => r.remarks === 'Fail').length;
  const bestReport = reports.length > 0 ? reports.reduce((a, b) => a.overallAverage > b.overallAverage ? a : b) : null;
  const bestStudent = bestReport ? await Student.findById(bestReport.studentId).select('firstName lastName studentCode').lean() : null;
  const bestStudentAverage = bestReport ? bestReport.overallAverage : 0;
  const classMap = {};
  for (const r of reports) {
    const key = r.classId.toString();
    if (!classMap[key]) classMap[key] = { total: 0, count: 0, passed: 0 };
    classMap[key].total += r.overallAverage;
    classMap[key].count++;
    if (r.remarks === 'Pass') classMap[key].passed++;
  }
  let bestClass = null;
  let bestClassAvg = 0;
  let bestClassPassRate = 0;
  const classIds = Object.entries(classMap);
  if (classIds.length > 0) {
    const bestEntry = classIds.reduce((a, b) => (a[1].total / a[1].count) > (b[1].total / b[1].count) ? a : b);
    bestClassAvg = bestEntry[1].total / bestEntry[1].count;
    bestClassPassRate = Math.round((bestEntry[1].passed / bestEntry[1].count) * 100 * 100) / 100;
    const classDoc = await Class.findById(bestEntry[0]).select('name').lean();
    if (classDoc) bestClass = classDoc.name;
  }
  return res.json({
    success: true,
    data: {
      totalStudents,
      totalTeachers,
      totalClasses,
      averagePerformance: Math.round(avgPerformance * 100) / 100,
      gradeDistribution,
      passRate: reports.length > 0 ? Math.round((passed / reports.length) * 100 * 100) / 100 : 0,
      failRate: reports.length > 0 ? Math.round((failed / reports.length) * 100 * 100) / 100 : 0,
      bestStudent,
      bestStudentAverage,
      bestClass,
      bestClassAvg,
      bestClassPassRate,
    },
  });
});

const getClassAnalytics = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user._id }).populate({ path: 'subjectIds', select: 'classIds' });
    if (teacher) {
      const classIdSet = new Set();
      for (const subject of teacher.subjectIds) {
        for (const cid of subject.classIds) classIdSet.add(cid.toString());
      }
      if (!classIdSet.has(classId.toString())) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view analytics for this class',
        });
      }
    }
  }
  const { termId, academicYearId } = req.query;
  let match = { classId };
  if (termId) match.termId = termId;
  if (academicYearId) match.academicYearId = academicYearId;
  const reports = await Report.find(match)
    .populate('studentId', 'firstName lastName studentCode')
    .sort({ overallAverage: -1 });
  const totalStudents = reports.length;
  const passed = reports.filter((r) => r.remarks === 'Pass').length;
  const failed = reports.filter((r) => r.remarks === 'Fail').length;
  const classAverage = totalStudents > 0
    ? reports.reduce((sum, r) => sum + r.overallAverage, 0) / totalStudents
    : 0;
  const gradeDistribution = { Excellent: 0, 'V.Good': 0, Good: 0, 'F.Good': 0, Tried: 0, Improve: 0, Failed: 0 };
  reports.forEach((r) => {
    if (gradeDistribution[r.grade] !== undefined) gradeDistribution[r.grade]++;
  });
  return res.json({
    success: true,
    data: {
      totalStudents,
      passed,
      failed,
      passRate: totalStudents > 0 ? Math.round((passed / totalStudents) * 100 * 100) / 100 : 0,
      failRate: totalStudents > 0 ? Math.round((failed / totalStudents) * 100 * 100) / 100 : 0,
      classAverage: Math.round(classAverage * 100) / 100,
      gradeDistribution,
      rankings: reports.map((r, i) => ({
        rank: i + 1,
        student: r.studentId,
        overallAverage: r.overallAverage,
        grade: r.grade,
        remarks: r.remarks,
      })),
    },
  });
});

const getSubjectAnalytics = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user._id }).select('subjectIds').lean();
    if (teacher && !teacher.subjectIds.some(sid => sid.toString() === subjectId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view analytics for this subject',
      });
    }
  }
  const { termId, academicYearId } = req.query;
  let match = { subjectId };
  if (termId) match.termId = termId;
  if (academicYearId) match.academicYearId = academicYearId;
  const marks = await Mark.find(match)
    .populate('studentId', 'firstName lastName studentCode classId')
    .populate('classId', 'name');
  const totalStudents = marks.length;
  const avgMark = totalStudents > 0
    ? marks.reduce((sum, m) => sum + m.subjectAverage, 0) / totalStudents
    : 0;
  const highest = totalStudents > 0 ? Math.max(...marks.map((m) => m.subjectAverage)) : 0;
  const lowest = totalStudents > 0 ? Math.min(...marks.map((m) => m.subjectAverage)) : 0;
  return res.json({
    success: true,
    data: {
      subjectId,
      totalStudents,
      averageMark: Math.round(avgMark * 100) / 100,
      highestMark: Math.round(highest * 100) / 100,
      lowestMark: Math.round(lowest * 100) / 100,
    },
  });
});

const getTopStudents = asyncHandler(async (req, res) => {
  const { limit: qLimit, termId, academicYearId } = req.query;
  let match = {};
  if (termId) match.termId = termId;
  if (academicYearId) match.academicYearId = academicYearId;
  const reports = await Report.find(match)
    .populate('studentId', 'firstName lastName studentCode')
    .sort({ overallAverage: -1 })
    .limit(parseInt(qLimit) || 10)
    .lean();
  return res.json({ success: true, data: reports });
});

const getBottomStudents = asyncHandler(async (req, res) => {
  const { limit: qLimit, termId, academicYearId } = req.query;
  let match = {};
  if (termId) match.termId = termId;
  if (academicYearId) match.academicYearId = academicYearId;
  const reports = await Report.find(match)
    .populate('studentId', 'firstName lastName studentCode')
    .sort({ overallAverage: 1 })
    .limit(parseInt(qLimit) || 10);
  return res.json({ success: true, data: reports });
});

module.exports = {
  getSchoolAnalytics,
  getClassAnalytics,
  getSubjectAnalytics,
  getTopStudents,
  getBottomStudents,
};
