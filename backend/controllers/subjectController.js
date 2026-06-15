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
    .sort({ name: 1 })
    .lean();

  const subjectIdStrs = subjects.map(s => s._id.toString());
  const teacherIdStrs = [...new Set(subjects.flatMap(s => (s.teacherIds || []).map(t => t._id?.toString() || t.toString())))];

  const newFormatTeachers = await Teacher.find(
    { 'subjectIds.subjectId': { $in: subjectIdStrs } }
  ).select('firstName lastName subjectIds').lean();

  const oldFormatTeachers = teacherIdStrs.length > 0 ? await Teacher.find(
    { _id: { $in: teacherIdStrs }, subjectIds: { $elemMatch: { $not: { $type: 'object' } } } }
  ).select('firstName lastName subjectIds').lean() : [];

  const teacherSubjectMap = {};
  for (const t of newFormatTeachers) {
    for (const entry of t.subjectIds || []) {
      if (!entry || typeof entry !== 'object' || !entry.subjectId) continue;
      const sid = entry.subjectId.toString();
      if (!teacherSubjectMap[sid]) teacherSubjectMap[sid] = [];
      if (!teacherSubjectMap[sid].some(tm => tm._id.toString() === t._id.toString())) {
        teacherSubjectMap[sid].push({
          _id: t._id,
          firstName: t.firstName,
          lastName: t.lastName,
          classIds: (entry.classIds || []).map(c => c._id || c).map(c => c.toString?.() || c),
        });
      }
    }
  }
  const seenTeachers = new Set();
  for (const sid of subjectIdStrs) {
    for (const tm of teacherSubjectMap[sid] || []) seenTeachers.add(tm._id.toString());
  }
  for (const t of oldFormatTeachers) {
    if (seenTeachers.has(t._id.toString())) continue;
    for (const entry of t.subjectIds || []) {
      if (!entry || (typeof entry === 'object' && entry.subjectId)) continue;
      const sid = entry.toString?.() || entry;
      if (!teacherSubjectMap[sid]) teacherSubjectMap[sid] = [];
      teacherSubjectMap[sid].push({
        _id: t._id,
        firstName: t.firstName,
        lastName: t.lastName,
        classIds: [],
      });
    }
  }

  for (const s of subjects) {
    const sid = s._id.toString();
    const mapped = teacherSubjectMap[sid] || [];
    const mappedIds = new Set(mapped.map(t => t._id.toString()));
    for (const t of (s.teacherIds || [])) {
      const tid = t._id?.toString() || t.toString();
      if (!mappedIds.has(tid)) {
        mapped.push({
          _id: tid,
          firstName: t.firstName || '',
          lastName: t.lastName || '',
          classIds: [],
        });
      }
    }
    s.teachers = mapped;
  }

  return res.json({
    success: true,
    data: subjects,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

function parseArrayField(value) {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch {}
  try { return JSON.parse(value.replace(/'/g, '"')); } catch {}
  try { return JSON.parse(value.replace(/(\w+)\s*:/g, '"$1":')); } catch {}
  try { return JSON.parse(value.replace(/'/g, '"').replace(/(\w+)\s*:/g, '"$1":')); } catch {}
  return [];
}

const createSubject = asyncHandler(async (req, res) => {
  let { name, level, classIds } = req.body;
  classIds = parseArrayField(classIds);
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
  const subject = await Subject.findById(req.params.id).populate('teacherIds', 'firstName lastName').lean();
  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found',
    });
  }
  const [newFormatTeachers, oldFormatTeachers] = await Promise.all([
    Teacher.find({ 'subjectIds.subjectId': subject._id }).select('firstName lastName subjectIds').lean(),
    Teacher.find({ subjectIds: subject._id }).select('firstName lastName subjectIds').lean(),
  ]);
  subject.teachers = [];
  const seen = new Set();
  for (const t of newFormatTeachers) {
    const entry = (t.subjectIds || []).find(
      e => e && typeof e === 'object' && e.subjectId && e.subjectId.toString() === subject._id.toString()
    );
    seen.add(t._id.toString());
    subject.teachers.push({
      _id: t._id,
      firstName: t.firstName,
      lastName: t.lastName,
      classIds: (entry?.classIds || []).map(c => c._id || c).map(c => c.toString?.() || c),
    });
  }
  for (const t of oldFormatTeachers) {
    if (seen.has(t._id.toString())) continue;
    subject.teachers.push({
      _id: t._id,
      firstName: t.firstName,
      lastName: t.lastName,
      classIds: [],
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
  if (req.body.classIds !== undefined) subject.classIds = parseArrayField(req.body.classIds);
  if (req.body.teacherIds !== undefined) subject.teacherIds = parseArrayField(req.body.teacherIds);
  const updated = await subject.save();

  if (req.body.teacherIds !== undefined) {
    const newTeacherIds = (subject.teacherIds || []).map(id => id.toString());
    const removed = oldTeacherIds.filter(id => !newTeacherIds.includes(id));
    const added = newTeacherIds.filter(id => !oldTeacherIds.includes(id));

    if (removed.length) {
      await Teacher.updateMany(
        { _id: { $in: removed } },
        { $pull: { subjectIds: { subjectId: subject._id } } }
      );
      await Teacher.updateMany(
        { _id: { $in: removed } },
        { $pull: { subjectIds: subject._id } }
      );
    }

    if (added.length) {
      for (const tid of added) {
        const exists = await Teacher.findOne({ _id: tid, 'subjectIds.subjectId': subject._id });
        if (!exists) {
          await Teacher.updateOne(
            { _id: tid },
            { $push: { subjectIds: { subjectId: subject._id, classIds: subject.classIds } } }
          );
        }
      }
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
  await Teacher.updateMany(
    { 'subjectIds.subjectId': subject._id },
    { $pull: { subjectIds: { subjectId: subject._id } } }
  );
  await Teacher.updateMany(
    { subjectIds: subject._id },
    { $pull: { subjectIds: subject._id } }
  );
  await Subject.deleteOne({ _id: subject._id });
  return res.json({
    success: true,
    message: 'Subject deleted successfully',
  });
});

const assignTeacher = asyncHandler(async (req, res) => {
  let { teacherId, classIds } = req.body;
  classIds = parseArrayField(classIds);
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

  const effectiveClassIds = classIds || subject.classIds;
  const existingEntry = teacher.subjectIds.find(
    s => s.subjectId && s.subjectId.toString() === subject._id.toString()
  );
  if (existingEntry) {
    existingEntry.classIds = effectiveClassIds;
  } else {
    const hasOldFormat = teacher.subjectIds.some(id => !id || typeof id === 'object' && !id.subjectId);
    if (hasOldFormat) {
      teacher.subjectIds = teacher.subjectIds.filter(
        id => id && id.toString() !== subject._id.toString()
      );
    }
    teacher.subjectIds.push({ subjectId: subject._id, classIds: effectiveClassIds });
  }
  await teacher.save();

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
