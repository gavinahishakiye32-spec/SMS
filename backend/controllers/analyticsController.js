const asyncHandler = require('express-async-handler');
const Report = require('../models/Report');
const Mark = require('../models/Mark');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const { getTeacherClassIdSet } = require('../utils/teacherPermissions');
const { resolveQueryAcademicYear, resolveQueryTerm } = require('../utils/activeYear');

const getSchoolAnalytics = asyncHandler(async (req, res) => {
  const qTermId = await resolveQueryTerm(req.query.termId, req.query.academicYearId);
  const qAcademicYearId = await resolveQueryAcademicYear(req.query.academicYearId);
  let match = {};
  if (qTermId) match.termId = qTermId;
  if (qAcademicYearId) match.academicYearId = qAcademicYearId;

  const [totalStudents, totalTeachers, totalClasses] = await Promise.all([
    Student.countDocuments(qAcademicYearId ? { academicYearId: qAcademicYearId } : {}),
    Teacher.countDocuments({}),
    Class.countDocuments(qAcademicYearId ? { academicYearId: qAcademicYearId } : {}),
  ]);

  const reports = await Report.find(match)
    .select('overallAverage grade remarks classId studentId')
    .lean();

  const rLen = reports.length;
  if (rLen === 0) {
    return res.json({
      success: true,
      data: {
        totalStudents, totalTeachers, totalClasses,
        averagePerformance: 0,
        gradeDistribution: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 },
        passRate: 0, failRate: 0,
        bestStudent: null, bestStudentAverage: 0,
        bestClass: null, bestClassAvg: 0, bestClassPassRate: 0,
      },
    });
  }

  let sumAvg = 0, passed = 0;
  const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  const classMap = {};
  let bestReport = reports[0];

  for (let i = 0; i < rLen; i++) {
    const r = reports[i];
    sumAvg += r.overallAverage;
    if (gradeDistribution[r.grade] !== undefined) gradeDistribution[r.grade]++;
    if (r.remarks === 'Pass') passed++;
    if (r.overallAverage > bestReport.overallAverage) bestReport = r;

    const key = r.classId.toString();
    if (!classMap[key]) classMap[key] = { total: 0, count: 0, passed: 0 };
    classMap[key].total += r.overallAverage;
    classMap[key].count++;
    if (r.remarks === 'Pass') classMap[key].passed++;
  }

  const failed = rLen - passed;
  const avgPerformance = sumAvg / rLen;

  const bestStudent = await Student.findById(bestReport.studentId)
    .select('firstName lastName studentCode')
    .lean();

  let bestClass = null, bestClassAvg = 0, bestClassPassRate = 0;
  const classEntries = Object.entries(classMap);
  if (classEntries.length > 0) {
    let bestKey = classEntries[0][0];
    let bestAvg = classEntries[0][1].total / classEntries[0][1].count;
    for (let i = 1; i < classEntries.length; i++) {
      const avg = classEntries[i][1].total / classEntries[i][1].count;
      if (avg > bestAvg) { bestAvg = avg; bestKey = classEntries[i][0]; }
    }
    bestClassAvg = bestAvg;
    const bestEntry = classMap[bestKey];
    bestClassPassRate = Math.round((bestEntry.passed / bestEntry.count) * 10000) / 100;
    const classDoc = await Class.findById(bestKey).select('name').lean();
    if (classDoc) bestClass = classDoc.name;
  }

  return res.json({
    success: true,
    data: {
      totalStudents, totalTeachers, totalClasses,
      averagePerformance: Math.round(avgPerformance * 100) / 100,
      gradeDistribution,
      passRate: Math.round((passed / rLen) * 10000) / 100,
      failRate: Math.round((failed / rLen) * 10000) / 100,
      bestStudent,
      bestStudentAverage: bestReport.overallAverage,
      bestClass, bestClassAvg, bestClassPassRate,
    },
  });
});

const getClassAnalytics = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  if (req.user.role === 'teacher') {
    const allowedClassIds = await getTeacherClassIdSet(req.user._id);
    if (!allowedClassIds.has(classId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view analytics for this class',
      });
    }
  }
  const qTermId = await resolveQueryTerm(req.query.termId, req.query.academicYearId);
  const qAcademicYearId = await resolveQueryAcademicYear(req.query.academicYearId);
  let match = { classId };
  if (qTermId) match.termId = qTermId;
  if (qAcademicYearId) match.academicYearId = qAcademicYearId;

  const reports = await Report.find(match)
    .populate('studentId', 'firstName lastName studentCode')
    .sort({ overallAverage: -1 });
  const totalStudents = reports.length;
  const passed = reports.filter((r) => r.remarks === 'Pass').length;
  const failed = reports.filter((r) => r.remarks === 'Fail').length;
  const classAverage = totalStudents > 0
    ? reports.reduce((sum, r) => sum + r.overallAverage, 0) / totalStudents
    : 0;
  const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
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
    if (teacher && teacher.subjectIds) {
      const hasSubject = teacher.subjectIds.some(entry => {
        if (entry && typeof entry === 'object' && entry.subjectId) {
          return entry.subjectId.toString() === subjectId.toString();
        }
        return entry && entry.toString() === subjectId.toString();
      });
      if (!hasSubject) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view analytics for this subject',
        });
      }
    }
  }
  const qTermId = await resolveQueryTerm(req.query.termId, req.query.academicYearId);
  const qAcademicYearId = await resolveQueryAcademicYear(req.query.academicYearId);
  let match = { subjectId };
  if (qTermId) match.termId = qTermId;
  if (qAcademicYearId) match.academicYearId = qAcademicYearId;
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
  const { limit: qLimit } = req.query;
  const qTermId = await resolveQueryTerm(req.query.termId, req.query.academicYearId);
  const qAcademicYearId = await resolveQueryAcademicYear(req.query.academicYearId);
  let match = {};
  if (qTermId) match.termId = qTermId;
  if (qAcademicYearId) match.academicYearId = qAcademicYearId;
  const reports = await Report.find(match)
    .select('overallAverage grade studentId')
    .populate('studentId', 'firstName lastName studentCode')
    .sort({ overallAverage: -1 })
    .limit(Math.min(parseInt(qLimit) || 10, 100))
    .lean();
  return res.json({ success: true, data: reports });
});

const getBottomStudents = asyncHandler(async (req, res) => {
  const { limit: qLimit } = req.query;
  const qTermId = await resolveQueryTerm(req.query.termId, req.query.academicYearId);
  const qAcademicYearId = await resolveQueryAcademicYear(req.query.academicYearId);
  let match = {};
  if (qTermId) match.termId = qTermId;
  if (qAcademicYearId) match.academicYearId = qAcademicYearId;
  const reports = await Report.find(match)
    .select('overallAverage grade studentId')
    .populate('studentId', 'firstName lastName studentCode')
    .sort({ overallAverage: 1 })
    .limit(Math.min(parseInt(qLimit) || 10, 100));
  return res.json({ success: true, data: reports });
});

module.exports = {
  getSchoolAnalytics,
  getClassAnalytics,
  getSubjectAnalytics,
  getTopStudents,
  getBottomStudents,
};
