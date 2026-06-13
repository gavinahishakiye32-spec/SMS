const asyncHandler = require('express-async-handler');
const Student = require('../models/Student');
const User = require('../models/User');
const AcademicYear = require('../models/AcademicYear');
const Section = require('../models/Section');
const Class = require('../models/Class');
const Mark = require('../models/Mark');
const Report = require('../models/Report');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const { recalculateRanks } = require('./markController');

const generateStudentCode = async () => {
  const year = new Date().getFullYear().toString();
  const lastStudent = await Student.findOne({ studentCode: new RegExp(`^SMS${year}`) })
    .sort({ studentCode: -1 })
    .limit(1);
  if (lastStudent) {
    const prefix = `SMS${year}`;
    const lastNum = parseInt(lastStudent.studentCode.slice(prefix.length), 10);
    return `${prefix}${String(lastNum + 1).padStart(3, '0')}`;
  }
  return `SMS${year}001`;
};

const getStudents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  let query = {};
  if (req.query.search) {
    const escaped = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escaped, 'i');
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { studentCode: searchRegex },
    ];
  }
  if (req.query.classId) query.classId = req.query.classId;
  if (req.query.sectionId) query.sectionId = req.query.sectionId;
  if (req.query.academicYearId) query.academicYearId = req.query.academicYearId;
  if (req.query.gender) query.gender = req.query.gender;
  if (req.query.userId) query.userId = req.query.userId;
  if (req.query.level) {
    const classes = await Class.find({ level: req.query.level }).select('_id');
    if (!req.query.classId) query.classId = { $in: classes.map(c => c._id) };
  }
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user._id }).populate({ path: 'subjectIds', select: 'classIds' });
    if (!teacher) {
      return res.status(403).json({ success: false, message: 'Teacher profile not found' });
    }
    const classIdSet = new Set();
    for (const subject of teacher.subjectIds) {
      for (const cid of subject.classIds) {
        classIdSet.add(cid.toString());
      }
    }
    const allowedClassIds = [...classIdSet];
    const specificClassId = typeof query.classId === 'string' ? query.classId : null;
    if (specificClassId) {
      if (!allowedClassIds.includes(specificClassId)) {
        return res.status(403).json({ success: false, message: 'You do not have permission to view students in this class' });
      }
    } else {
      query.classId = allowedClassIds.length > 0 ? { $in: allowedClassIds } : { $in: [] };
    }
  }
  if (req.user.role === 'student') {
    query.userId = req.user._id;
  }
  const total = await Student.countDocuments(query);
  let studentQuery = Student.find(query);
  if (req.user.role === 'teacher') {
    studentQuery = studentQuery.select('-studentCode -gender -dateOfBirth -NIN -address -phoneNumber -userId');
  }
  const students = await studentQuery
    .populate('classId', 'name level')
    .populate('sectionId', 'name')
    .populate('academicYearId', 'year')
    .populate('userId', 'email')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();
  return res.json({
    success: true,
    data: students,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

const createStudent = asyncHandler(async (req, res) => {
  const { firstName, lastName, gender, dateOfBirth, NIN, address, phoneNumber, email, classId, sectionId, sectionName, academicYearId } = req.body;
  if (!firstName || !lastName || !gender || !classId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide required fields: firstName, lastName, gender, classId',
    });
  }
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user._id }).populate({ path: 'subjectIds', select: 'classIds' });
    if (!teacher) {
      return res.status(403).json({ success: false, message: 'Teacher profile not found' });
    }
    const allowedClassIds = new Set();
    for (const subject of teacher.subjectIds) {
      for (const cid of subject.classIds) allowedClassIds.add(cid.toString());
    }
    if (!allowedClassIds.has(classId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create students in this class',
      });
    }
  }
  let academicYear = academicYearId;
  if (!academicYear) {
    const activeYear = await AcademicYear.findOne({ isActive: true });
    if (!activeYear) {
      return res.status(400).json({
        success: false,
        message: 'No active academic year found. Please create and activate one first.',
      });
    }
    academicYear = activeYear._id;
  }
  let resolvedSectionId = sectionId || undefined;
  if (!resolvedSectionId && sectionName) {
    let section = await Section.findOne({ name: sectionName, classId });
    if (!section) {
      section = await Section.create({ name: sectionName, classId });
    }
    resolvedSectionId = section._id;
  }
  const profilePhoto = req.file ? req.file.path : '';
  let studentCode;
  let user;
  let student;
  let attempts = 0;
  const MAX_RETRIES = 10;
  while (attempts < MAX_RETRIES) {
    attempts++;
    studentCode = await generateStudentCode();
    const existingCode = await Student.findOne({ studentCode });
    if (existingCode) continue;
    const loginEmail = email || `${studentCode.toLowerCase()}@sms.edu`;
    const existingUser = await User.findOne({ email: loginEmail });
    if (existingUser) {
      const orphanStudent = await Student.findOne({ userId: existingUser._id });
      if (orphanStudent) {
        await Student.create({
          studentCode, firstName: '--RESERVED--', lastName: '--RESERVED--',
          gender: 'Male', classId, academicYearId: academicYear,
        }).catch(() => {});
        continue;
      }
      return res.status(409).json({
        success: false,
        message: `Email ${loginEmail} is already in use by another user`,
      });
    }
    try {
      user = await User.create({
        name: `${firstName} ${lastName}`,
        email: loginEmail,
        password: 'student123',
        role: 'student',
      });
    } catch (err) {
      if (err.code === 11000) {
        await Student.create({
          studentCode, firstName: '--RESERVED--', lastName: '--RESERVED--',
          gender: 'Male', classId, academicYearId: academicYear,
        }).catch(() => {});
        continue;
      }
      throw err;
    }
    try {
      student = await Student.create({
        userId: user._id,
        studentCode,
        firstName,
        lastName,
        gender,
        dateOfBirth,
        NIN,
        address,
        phoneNumber,
        classId,
        sectionId: resolvedSectionId,
        academicYearId: academicYear,
        profilePhoto,
      });
    } catch (err) {
      await User.deleteOne({ _id: user._id }).catch(() => {});
      if (err.code === 11000) continue;
      throw err;
    }
    const populated = await Student.findById(student._id)
      .populate('classId', 'name level')
      .populate('sectionId', 'name')
      .populate('academicYearId', 'year');
    const studentData = populated.toObject();
    studentData.defaultPassword = 'student123';
    studentData.email = loginEmail;
    return res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: studentData,
    });
  }
  return res.status(409).json({
    success: false,
    message: 'Could not create student due to a code conflict. Please try again.',
  });
});

const getStudentById = asyncHandler(async (req, res) => {
  let query = Student.findById(req.params.id);
  if (req.user.role === 'teacher') {
    query = query.select('-studentCode -gender -dateOfBirth -NIN -address -phoneNumber -userId');
  }
  const student = await query
    .populate('classId', 'name level')
    .populate('sectionId', 'name')
    .populate('academicYearId', 'year')
    .populate('userId', 'email')
    .lean();
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }
  if (req.user.role === 'student' && req.user._id.toString() !== (student.userId || '').toString()) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission for this action',
    });
  }
  return res.json({ success: true, data: student });
});

const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user._id }).populate({ path: 'subjectIds', select: 'classIds' });
    if (!teacher) {
      return res.status(403).json({ success: false, message: 'Teacher profile not found' });
    }
    const allowedClassIds = new Set();
    for (const subject of teacher.subjectIds) {
      for (const cid of subject.classIds) allowedClassIds.add(cid.toString());
    }
    const targetClassId = (req.body.classId || student.classId).toString();
    if (!allowedClassIds.has(targetClassId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update students in this class',
      });
    }
  }
  const { sectionName } = req.body;
  if (sectionName) {
    let section = await Section.findOne({ name: sectionName, classId: req.body.classId || student.classId });
    if (!section) {
      section = await Section.create({ name: sectionName, classId: req.body.classId || student.classId });
    }
    student.sectionId = section._id;
  }
  const fields = ['firstName', 'lastName', 'gender', 'dateOfBirth', 'NIN', 'address', 'phoneNumber', 'classId', 'sectionId', 'academicYearId'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) student[f] = req.body[f];
  });
  if (req.body.email && student.userId) {
    await User.findByIdAndUpdate(student.userId, { email: req.body.email });
  }
  if (req.file) student.profilePhoto = req.file.path;
  const updated = await student.save();
  return res.json({
    success: true,
    message: 'Student updated successfully',
    data: updated,
  });
});

const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user._id }).populate({ path: 'subjectIds', select: 'classIds' });
    if (!teacher) {
      return res.status(403).json({ success: false, message: 'Teacher profile not found' });
    }
    const allowedClassIds = new Set();
    for (const subject of teacher.subjectIds) {
      for (const cid of subject.classIds) allowedClassIds.add(cid.toString());
    }
    if (!allowedClassIds.has(student.classId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete students in this class',
      });
    }
  }
  const reportsToDelete = await Report.find({ studentId: student._id }).select('termId academicYearId').lean();
  const affectedPairs = [...new Map(reportsToDelete.map(r => [`${r.termId}|${r.academicYearId}`, { termId: r.termId, academicYearId: r.academicYearId }])).values()];
  if (student.userId) await User.deleteOne({ _id: student.userId });
  await Mark.deleteMany({ studentId: student._id });
  await Report.deleteMany({ studentId: student._id });
  await Student.deleteOne({ _id: student._id });
  for (const pair of affectedPairs) {
    await recalculateRanks(pair.termId, pair.academicYearId);
  }
  return res.json({
    success: true,
    message: 'Student deleted successfully',
  });
});

const getStudentReport = asyncHandler(async (req, res) => {
  let query = Student.findById(req.params.id);
  if (req.user.role === 'teacher') {
    query = query.select('-studentCode -gender -dateOfBirth -NIN -address -phoneNumber -userId');
  }
  const student = await query
    .populate('classId', 'name level')
    .populate('sectionId', 'name')
    .populate('academicYearId', 'year');
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }
  if (req.user.role === 'student' && req.user._id.toString() !== (student.userId || '').toString()) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to view this report',
    });
  }
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user._id }).populate({ path: 'subjectIds', select: 'classIds' });
    if (!teacher) {
      return res.status(403).json({ success: false, message: 'Teacher profile not found' });
    }
    const classIdSet = new Set();
    for (const subject of teacher.subjectIds) {
      for (const cid of subject.classIds) classIdSet.add(cid.toString());
    }
    if (!classIdSet.has(student.classId?._id?.toString() || student.classId?.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this report',
      });
    }
  }
  const { termId } = req.query;
  let reportQuery = { studentId: student._id };
  if (termId) reportQuery.termId = termId;
  if (student.academicYearId) reportQuery.academicYearId = student.academicYearId._id;
  let report = await Report.findOne(reportQuery)
    .populate('termId')
    .populate('academicYearId');
  if (!report) {
    return res.json({
      success: true,
      message: 'Report not yet generated for this term',
      data: null,
    });
  }
  const marks = await Mark.find({
    studentId: student._id,
    termId: report.termId,
    academicYearId: report.academicYearId,
  }).populate('subjectId', 'name');
  return res.json({
    success: true,
    data: {
      student,
      report,
      marks,
    },
  });
});

const getStudentRanking = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }
  if (req.user.role === 'student' && req.user._id.toString() !== (student.userId || '').toString()) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to view this ranking',
    });
  }
  const { termId, academicYearId } = req.query;
  let match = {};
  if (student.classId) match.classId = student.classId;
  if (termId) match.termId = termId;
  if (academicYearId) match.academicYearId = academicYearId;
  const reports = await Report.find(match).sort({ overallAverage: -1 });
  const rank = reports.findIndex(
    (r) => r.studentId && r.studentId.toString() === student._id.toString()
  ) + 1;
  return res.json({
    success: true,
    data: {
      rank: rank > 0 ? rank : reports.length + 1,
      total: reports.length,
    },
  });
});

module.exports = {
  getStudents,
  createStudent,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentReport,
  getStudentRanking,
};
