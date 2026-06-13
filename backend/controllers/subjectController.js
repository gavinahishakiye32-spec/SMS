const asyncHandler = require('express-async-handler');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Mark = require('../models/Mark');

const getSubjects = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  let query = {};
  if (req.query.level) query.level = req.query.level;
  if (req.query.search) {
    const escaped = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.name = new RegExp(escaped, 'i');
  }
  const total = await Subject.countDocuments(query);
  const subjects = await Subject.find(query)
    .populate('teacherIds', 'firstName lastName')
    .populate('classIds', 'name level')
    .skip(skip)
    .limit(limit)
    .sort({ name: 1 });
  return res.json({
    success: true,
    data: subjects,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

const createSubject = asyncHandler(async (req, res) => {
  const { name, level, classIds } = req.body;
  if (!name || !level) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name and level',
    });
  }
  const exists = await Subject.findOne({ name, level });
  if (exists) {
    return res.status(409).json({
      success: false,
      message: 'Subject already exists',
    });
  }
  const subject = await Subject.create({ name, level, classIds: classIds || [] });
  return res.status(201).json({
    success: true,
    message: 'Subject created successfully',
    data: subject,
  });
});

const getSubjectById = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id).populate('teacherIds', 'firstName lastName');
  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found',
    });
  }
  return res.json({ success: true, data: subject });
});

const updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found',
    });
  }
  const oldTeacherIds = subject.teacherIds.map(id => id.toString());
  if (req.body.name !== undefined) subject.name = req.body.name;
  if (req.body.level !== undefined) subject.level = req.body.level;
  if (req.body.classIds !== undefined) subject.classIds = req.body.classIds;
  if (req.body.teacherIds !== undefined) subject.teacherIds = req.body.teacherIds;
  const updated = await subject.save();

  if (req.body.teacherIds !== undefined) {
    const newTeacherIds = req.body.teacherIds.map(id => id.toString());
    const removed = oldTeacherIds.filter(id => !newTeacherIds.includes(id));
    const added = newTeacherIds.filter(id => !oldTeacherIds.includes(id));
    if (removed.length) {
      await Teacher.updateMany(
        { _id: { $in: removed } },
        { $pull: { subjectIds: subject._id } }
      );
    }
    if (added.length) {
      await Teacher.updateMany(
        { _id: { $in: added } },
        { $addToSet: { subjectIds: subject._id } }
      );
    }
  }

  return res.json({
    success: true,
    message: 'Subject updated successfully',
    data: updated,
  });
});

const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found',
    });
  }
  await Mark.deleteMany({ subjectId: subject._id });
  await Teacher.updateMany({ subjectIds: subject._id }, { $pull: { subjectIds: subject._id } });
  await Subject.deleteOne({ _id: subject._id });
  return res.json({
    success: true,
    message: 'Subject deleted successfully',
  });
});

const assignTeacher = asyncHandler(async (req, res) => {
  const { teacherId } = req.body;
  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found',
    });
  }
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }
  if (!subject.teacherIds.some(id => id.toString() === teacherId)) {
    subject.teacherIds.push(teacherId);
    await subject.save();
  }
  if (!teacher.subjectIds.some(id => id.toString() === subject._id.toString())) {
    teacher.subjectIds.push(subject._id);
    await teacher.save();
  }
  return res.json({
    success: true,
    message: 'Teacher assigned to subject successfully',
  });
});

module.exports = {
  getSubjects,
  createSubject,
  getSubjectById,
  updateSubject,
  deleteSubject,
  assignTeacher,
};
