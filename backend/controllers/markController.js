const asyncHandler = require('express-async-handler');
const Mark = require('../models/Mark');
const Teacher = require('../models/Teacher');
const Report = require('../models/Report');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const { calculateGrade, calculateSubjectAverage, calculateGradePoints } = require('../utils/gradeUtils');
const { getTeacherClassIdSet, getTeacherSubjectIds, getTeacherSubjectClassIdSet } = require('../utils/teacherPermissions');

const getMarks = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  let query = {};
  if (req.query.classId) query.classId = req.query.classId;
  if (req.query.sectionId) query.sectionId = req.query.sectionId;
  if (req.query.subjectId) query.subjectId = req.query.subjectId;
  if (req.query.termId) query.termId = req.query.termId;
  if (req.query.academicYearId) query.academicYearId = req.query.academicYearId;
  let levelFilteredClassIds = null;
  if (req.query.level) {
    const classes = await Class.find({ level: req.query.level }).select('_id');
    levelFilteredClassIds = classes.map(c => c._id.toString());
    if (!req.query.classId) query.classId = { $in: levelFilteredClassIds };
  }
  if (req.user.role === 'teacher') {
    const allowedClassIds = [...await getTeacherClassIdSet(req.user._id)];
    const specificClassId = typeof query.classId === 'string' ? query.classId : null;
    if (specificClassId) {
      if (!allowedClassIds.includes(specificClassId)) {
        return res.status(403).json({ success: false, message: 'You do not have permission to view marks for this class' });
      }
    } else {
      let classFilter = allowedClassIds;
      if (levelFilteredClassIds) {
        classFilter = allowedClassIds.filter(id => levelFilteredClassIds.includes(id));
      }
      if (classFilter.length > 0) {
        query.classId = { $in: classFilter };
      } else {
        query.classId = { $in: [] };
      }
    }
  }
  const total = await Mark.countDocuments(query);
  const marks = await Mark.find(query)
    .populate('studentId', 'firstName lastName studentCode')
    .populate('subjectId', 'name')
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .populate('termId', 'name')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();
  return res.json({
    success: true,
    data: marks,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

const addMarks = asyncHandler(async (req, res) => {
  const { studentId, subjectId, classId, sectionId, termId, academicYearId, midtermMarks, endTermMarks } = req.body;
  if (!studentId || !subjectId || !classId || !termId || !academicYearId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide required fields: studentId, subjectId, classId, termId, academicYearId',
    });
  }
  if (midtermMarks == null && endTermMarks == null) {
    return res.status(400).json({
      success: false,
      message: 'Please provide at least one of midtermMarks or endTermMarks',
    });
  }
  if ((midtermMarks != null && (midtermMarks < 0 || midtermMarks > 100)) ||
      (endTermMarks != null && (endTermMarks < 0 || endTermMarks > 100))) {
    return res.status(400).json({
      success: false,
      message: 'Mark must be between 0 and 100',
    });
  }
  let teacherId = req.body.teacherId;
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher profile not found',
      });
    }
    const teacherSubjectIds = await getTeacherSubjectIds(req.user._id);
    if (!teacherSubjectIds.includes(subjectId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add marks for this subject',
      });
    }
    const allowedClassIds = await getTeacherSubjectClassIdSet(req.user._id, subjectId);
    if (!allowedClassIds.has(classId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add marks for this class',
      });
    }
    teacherId = teacher._id;
  } else if (!teacherId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide teacherId',
    });
  }
  try {
    const mark = await Mark.create({
      studentId,
      subjectId,
      teacherId,
      classId,
      sectionId,
      termId,
      academicYearId,
      midtermMarks,
      endTermMarks,
    });
    await generateReportForStudent(studentId, termId, academicYearId);
    return res.status(201).json({
      success: true,
      message: 'Marks added successfully',
      data: mark,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Marks already exist for this student, subject, term, and academic year combination.',
      });
    }
    throw error;
  }
});

const getMarkById = asyncHandler(async (req, res) => {
  const mark = await Mark.findById(req.params.id)
    .populate('studentId', 'firstName lastName studentCode')
    .populate('subjectId', 'name')
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .populate('termId', 'name');
  if (!mark) {
    return res.status(404).json({
      success: false,
      message: 'Mark not found',
    });
  }
  if (req.user.role === 'teacher') {
    const teacherSubjectIds = await getTeacherSubjectIds(req.user._id);
    const targetSubjectId = mark.subjectId?._id?.toString() || mark.subjectId?.toString();
    if (!teacherSubjectIds.includes(targetSubjectId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this mark record',
      });
    }
  }
  return res.json({ success: true, data: mark });
});

const updateMarks = asyncHandler(async (req, res) => {
  const mark = await Mark.findById(req.params.id);
  if (!mark) {
    return res.status(404).json({
      success: false,
      message: 'Mark not found',
    });
  }
  if (req.user.role === 'teacher') {
    const teacherSubjectIds = await getTeacherSubjectIds(req.user._id);
    if (!teacherSubjectIds.includes(mark.subjectId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update marks for this subject',
      });
    }
    const allowedClassIds = await getTeacherSubjectClassIdSet(req.user._id, mark.subjectId);
    if (!allowedClassIds.has(mark.classId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update marks for this class',
      });
    }
  }
  if (req.body.midtermMarks !== undefined) {
    if (req.body.midtermMarks < 0 || req.body.midtermMarks > 100) {
      return res.status(400).json({
        success: false,
        message: 'Mark must be between 0 and 100',
      });
    }
    mark.midtermMarks = req.body.midtermMarks;
  }
  if (req.body.endTermMarks !== undefined) {
    if (req.body.endTermMarks < 0 || req.body.endTermMarks > 100) {
      return res.status(400).json({
        success: false,
        message: 'Mark must be between 0 and 100',
      });
    }
    mark.endTermMarks = req.body.endTermMarks;
  }
  const updated = await mark.save();
  await generateReportForStudent(mark.studentId, mark.termId, mark.academicYearId);
  return res.json({
    success: true,
    message: 'Marks updated successfully',
    data: updated,
  });
});

const deleteMarks = asyncHandler(async (req, res) => {
  const mark = await Mark.findById(req.params.id);
  if (!mark) {
    return res.status(404).json({
      success: false,
      message: 'Mark not found',
    });
  }
  await Mark.deleteOne({ _id: mark._id });
  await generateReportForStudent(mark.studentId, mark.termId, mark.academicYearId);
  return res.json({
    success: true,
    message: 'Marks deleted successfully',
  });
});

const getStudentMarks = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const studentExists = await Student.findById(studentId).select('userId classId').lean();
  if (!studentExists) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }
  if (req.user.role === 'student' && req.user._id.toString() !== (studentExists.userId || '').toString()) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to view these marks',
    });
  }
  if (req.user.role === 'teacher') {
    const allowedClassIds = await getTeacherClassIdSet(req.user._id);
    if (!allowedClassIds.has(studentExists.classId?.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view these marks',
      });
    }
  }
  const { termId, academicYearId } = req.query;
  let query = { studentId };
  if (termId) query.termId = termId;
  if (academicYearId) query.academicYearId = academicYearId;
  const marks = await Mark.find(query)
    .populate('subjectId', 'name level')
    .populate('termId', 'name')
    .sort({ createdAt: -1 })
    .limit(100);
  return res.json({ success: true, data: marks });
});

const getStudentSubjectMarks = asyncHandler(async (req, res) => {
  const { studentId, subjectId } = req.params;
  if (req.user.role === 'teacher') {
    const allowedClassIds = await getTeacherClassIdSet(req.user._id);
    const student = await Student.findById(studentId).select('classId').lean();
    if (!student || !allowedClassIds.has(student.classId?.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view these marks',
      });
    }
  }
  const marks = await Mark.find({ studentId, subjectId })
    .populate('termId', 'name')
    .sort({ createdAt: -1 });
  return res.json({ success: true, data: marks });
});

const getClassMarks = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  if (req.user.role === 'teacher') {
    const allowedClassIds = await getTeacherClassIdSet(req.user._id);
    if (!allowedClassIds.has(classId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view marks for this class',
      });
    }
  }
  const { termId } = req.query;
  let query = { classId };
  if (termId) query.termId = termId;
  const marks = await Mark.find(query)
    .populate('studentId', 'firstName lastName studentCode')
    .populate('subjectId', 'name')
    .populate('sectionId', 'name')
    .populate('termId', 'name')
    .sort({ createdAt: -1 })
    .limit(200);
  return res.json({ success: true, data: marks });
});

async function generateReportForStudent(studentId, termId, academicYearId) {
  const student = await Student.findById(studentId).lean();
  if (!student) return;
  const marks = await Mark.find({ studentId, termId, academicYearId }).lean();
  if (marks.length === 0) {
    await Report.deleteOne({ studentId, termId, academicYearId });
    return;
  }
  const classDoc = await Class.findById(student.classId).select('level').lean();
  const level = classDoc ? classDoc.level : 'O-Level';
  const midtermTotal = marks.reduce((sum, m) => sum + (m.midtermMarks || 0), 0);
  const endTermTotal = marks.reduce((sum, m) => sum + (m.endTermMarks || 0), 0);
  const subjectAverages = marks.map((m) => m.subjectAverage || 0);
  const combinedTotal = subjectAverages.reduce((sum, s) => sum + s, 0);
  const overallAverage = combinedTotal / marks.length;
  const grade = calculateGrade(overallAverage, level);
  const passGrades = level === 'A-Level' ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];
  const remarks = passGrades.includes(grade) ? 'Pass' : 'Fail';

  await Report.findOneAndUpdate(
    { studentId, termId, academicYearId },
    {
      studentId,
      classId: student.classId,
      sectionId: student.sectionId,
      termId,
      academicYearId,
      midtermTotal,
      midtermAverage: midtermTotal / marks.length,
      endTermTotal,
      endTermAverage: endTermTotal / marks.length,
      combinedTotal,
      overallAverage,
      grade,
      remarks,
    },
    { upsert: true }
  );

  await recalculateRanks(termId, academicYearId);
}

async function recalculateRanks(termId, academicYearId) {
  const allReports = await Report.find({ termId, academicYearId })
    .sort({ overallAverage: -1 })
    .lean();

  const classGroups = {};
  const totalInSchool = allReports.length;

  for (const r of allReports) {
    const ck = r.classId.toString();
    if (!classGroups[ck]) classGroups[ck] = [];
    classGroups[ck].push(r);
  }

  const bulk = allReports.map((r) => {
    const ck = r.classId.toString();
    const classRank = classGroups[ck].findIndex((cr) => cr._id.toString() === r._id.toString()) + 1;
    const totalInClass = classGroups[ck].length;
    const schoolRank = allReports.findIndex((sr) => sr._id.toString() === r._id.toString()) + 1;
    return {
      updateOne: {
        filter: { _id: r._id },
        update: { $set: { classRank, totalStudentsInClass: totalInClass, schoolRank, totalStudentsInSchool: totalInSchool } },
      },
    };
  });

  if (bulk.length > 0) {
    await Report.bulkWrite(bulk);
  }
}

module.exports = {
  getMarks,
  addMarks,
  getMarkById,
  updateMarks,
  deleteMarks,
  getStudentMarks,
  getStudentSubjectMarks,
  getClassMarks,
  recalculateRanks,
};
