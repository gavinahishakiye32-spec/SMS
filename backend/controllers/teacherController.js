const asyncHandler = require('express-async-handler');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Subject = require('../models/Subject');

const getTeachers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  let query = {};
  if (req.user.role === 'teacher') {
    query.userId = req.user._id;
  } else {
    if (req.query.search) {
      const escaped = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');
      query.$or = [{ firstName: searchRegex }, { lastName: searchRegex }, { email: searchRegex }];
    }
    if (req.query.level) {
      query.level = req.query.level;
    }
  }
  const total = await Teacher.countDocuments(query);
  const teachers = await Teacher.find(query)
    .populate({ path: 'subjectIds', select: 'name level classIds', populate: { path: 'classIds', select: 'name' } })
    .populate('userId', 'email')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();
  return res.json({
    success: true,
    data: teachers,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

const createTeacher = asyncHandler(async (req, res) => {
  const { firstName, lastName, gender, NIN, phoneNumber, email, level, subjectIds } = req.body;
  if (!firstName || !lastName || !email) {
    return res.status(400).json({
      success: false,
      message: 'Please provide firstName, lastName, and email',
    });
  }
  
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(409).json({
      success: false,
      message: 'A user with this email already exists. Please use a different email address.',
    });
  }
  
  try {
    const user = await User.create({
      name: `${firstName} ${lastName}`,
      email,
      password: 'teacher123',
      role: 'teacher',
    });
    
    const teacher = await Teacher.create({
      userId: user._id,
      firstName,
      lastName,
      NIN,
      gender,
      phoneNumber,
      email,
      level: level || undefined,
      subjectIds: subjectIds || [],
      profilePhoto: req.file ? req.file.path : '',
    });

    if (subjectIds?.length) {
      await Subject.updateMany(
        { _id: { $in: subjectIds } },
        { $addToSet: { teacherIds: teacher._id } }
      );
    }

    const teacherData = teacher.toObject();
    teacherData.defaultPassword = 'teacher123';
    return res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: teacherData,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists. Please use a different email address.',
      });
    }
    throw error;
  }
});

const getTeacherById = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id)
    .populate({ path: 'subjectIds', select: 'name level classIds', populate: { path: 'classIds', select: 'name' } })
    .populate('userId', 'email');
  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }
  if (req.user.role === 'teacher' && (teacher.userId?._id || teacher.userId).toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to view this teacher profile',
    });
  }
  return res.json({ success: true, data: teacher });
});

const updateTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }
  const oldSubjectIds = teacher.subjectIds.map(id => id.toString());
  const fields = ['firstName', 'lastName', 'gender', 'NIN', 'phoneNumber', 'email', 'level', 'subjectIds'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) teacher[f] = req.body[f];
  });
  if (req.file) teacher.profilePhoto = req.file.path;
  const updated = await teacher.save();

  const newSubjectIds = (req.body.subjectIds || []).map(id => id.toString());
  const removed = oldSubjectIds.filter(id => !newSubjectIds.includes(id));
  const added = newSubjectIds.filter(id => !oldSubjectIds.includes(id));

  if (removed.length) {
    await Subject.updateMany(
      { _id: { $in: removed } },
      { $pull: { teacherIds: teacher._id } }
    );
  }
  if (added.length) {
    await Subject.updateMany(
      { _id: { $in: added } },
      { $addToSet: { teacherIds: teacher._id } }
    );
  }

  return res.json({
    success: true,
    message: 'Teacher updated successfully',
    data: updated,
  });
});

const deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }
  if (teacher.userId) await User.deleteOne({ _id: teacher.userId });
  await Subject.updateMany({ teacherIds: teacher._id }, { $pull: { teacherIds: teacher._id } });
  await Teacher.deleteOne({ _id: teacher._id });
  return res.json({
    success: true,
    message: 'Teacher deleted successfully',
  });
});

const getTeacherSubjects = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id)
    .populate({ path: 'subjectIds', select: 'name level classIds', populate: { path: 'classIds', select: 'name' } });
  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }
  if (req.user.role === 'teacher') {
    const teacherUser = await Teacher.findOne({ userId: req.user._id });
    if (!teacherUser || teacherUser._id.toString() !== teacher._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission for this action',
      });
    }
  }
  return res.json({ success: true, data: teacher.subjectIds });
});

module.exports = {
  getTeachers,
  createTeacher,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getTeacherSubjects,
};
