const asyncHandler = require('express-async-handler');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Class = require('../models/Class');

const getTeachers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  let query = {};
  if (req.user.role === 'teacher') {
    query.userId = req.user._id;
  } else if (req.query.search) {
    const escaped = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escaped, 'i');
    query.$or = [{ firstName: searchRegex }, { lastName: searchRegex }, { email: searchRegex }];
  }
  const total = await Teacher.countDocuments(query);
  const teachers = await Teacher.find(query)
    .populate({ path: 'subjectIds.subjectId', select: 'name level' })
    .populate({ path: 'subjectIds.classIds', select: 'name' })
    .populate('userId', 'email')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();
  const data = await resolveTeacherSubjects(teachers);
  return res.json({
    success: true,
    data,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

function parseSubjectIds(value) {
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch {}
    try { return JSON.parse(value.replace(/'/g, '"')); } catch {}
    try { return JSON.parse(value.replace(/(\w+)\s*:/g, '"$1":')); } catch {}
    try { return JSON.parse(value.replace(/'/g, '"').replace(/(\w+)\s*:/g, '"$1":')); } catch {}
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap(item => {
      if (typeof item === 'string') {
        const parsed = parseSubjectIds(item);
        return Array.isArray(parsed) ? parsed : [parsed];
      }
      return item;
    });
  }
  return value;
}

const createTeacher = asyncHandler(async (req, res) => {
  let { firstName, lastName, gender, NIN, phoneNumber, email, subjectIds } = req.body;
  subjectIds = parseSubjectIds(subjectIds);
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
      subjectIds: subjectIds || [],
      profilePhoto: req.file ? req.file.path : '',
    });

    const extractedIds = extractSubjectIds(subjectIds);
    if (extractedIds.length) {
      await Subject.updateMany(
        { _id: { $in: extractedIds } },
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
    .populate({ path: 'subjectIds.subjectId', select: 'name level' })
    .populate({ path: 'subjectIds.classIds', select: 'name' })
    .populate('userId', 'email');
  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }
  if (req.user.role === 'teacher' && (!teacher.userId || (teacher.userId?._id || teacher.userId).toString() !== req.user._id.toString())) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to view this teacher profile',
    });
  }
  const data = await resolveTeacherSubjects([teacher.toObject()]);
  return res.json({ success: true, data: data[0] });
});

const updateTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    return res.status(404).json({
      success: false,
      message: 'Teacher not found',
    });
  }
  if (req.body.subjectIds) req.body.subjectIds = parseSubjectIds(req.body.subjectIds);
  const oldIds = extractSubjectIds(teacher.subjectIds);
  const fields = ['firstName', 'lastName', 'gender', 'NIN', 'phoneNumber', 'email', 'subjectIds'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) teacher[f] = req.body[f];
  });
  if (req.file) teacher.profilePhoto = req.file.path;
  const updated = await teacher.save();

  const newIds = extractSubjectIds(req.body.subjectIds);
  const removed = oldIds.filter(id => !newIds.includes(id));
  const added = newIds.filter(id => !oldIds.includes(id));

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
    .populate({ path: 'subjectIds.subjectId', select: 'name level' })
    .populate({ path: 'subjectIds.classIds', select: 'name' });
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
  const data = await resolveTeacherSubjects([teacher.toObject()]);
  return res.json({ success: true, data: data[0]?.subjectIds || [] });
});

function extractSubjectIds(subjectIds) {
  if (!subjectIds || !Array.isArray(subjectIds)) return [];
  if (subjectIds.length === 0) return [];
  if (typeof subjectIds[0] === 'object' && subjectIds[0] !== null) {
    return subjectIds.map(s => s.subjectId?.toString?.() || s.subjectId).filter(Boolean);
  }
  return subjectIds.map(id => id.toString?.() || id).filter(Boolean);
}

async function resolveTeacherSubjects(teachers) {
  const allSubjectIds = new Set();
  const allClassIds = new Set();

  for (const t of teachers) {
    for (const s of t.subjectIds || []) {
      if (s && typeof s === 'object' && s._id && s.name) {
        allSubjectIds.add(s._id.toString());
        for (const c of s.classIds || []) allClassIds.add(c._id?.toString() || c.toString());
      } else {
        const sid = s?._id?.toString() || s?.toString();
        if (sid) allSubjectIds.add(sid);
      }
    }
  }

  const [subjectMap, classMap] = await Promise.all([
    allSubjectIds.size > 0
      ? Subject.find({ _id: { $in: [...allSubjectIds] } }).select('name level classIds').lean()
          .then(subjects => {
            const map = {};
            for (const s of subjects) map[s._id.toString()] = s;
            return map;
          })
      : Promise.resolve({}),
    allClassIds.size > 0
      ? Class.find({ _id: { $in: [...allClassIds] } }).select('name').lean()
          .then(classes => {
            const map = {};
            for (const c of classes) map[c._id.toString()] = c;
            return map;
          })
      : Promise.resolve({}),
  ]);

  for (const t of teachers) {
    const resolved = [];
    for (const s of t.subjectIds || []) {
      if (s && typeof s === 'object' && s.subjectId && typeof s.subjectId === 'object' && s.subjectId.name) {
        resolved.push(s);
      } else if (s && typeof s === 'object' && s.subjectId) {
        const sid = s.subjectId._id?.toString() || s.subjectId.toString?.() || s.subjectId;
        const subject = subjectMap[sid?.toString()];
        if (subject) {
          resolved.push({
            subjectId: { _id: subject._id, name: subject.name, level: subject.level },
            classIds: (s.classIds || []).map(c => classMap[c._id?.toString() || c.toString()] || c),
          });
        }
      } else if (s && typeof s === 'object' && s._id && s.name) {
        resolved.push({
          subjectId: { _id: s._id, name: s.name, level: s.level },
          classIds: (s.classIds || []).map(c => classMap[c._id?.toString() || c.toString()] || c),
        });
      } else {
        const sid = s?._id?.toString() || s?.toString();
        const subject = subjectMap[sid];
        if (subject) {
          resolved.push({
            subjectId: { _id: subject._id, name: subject.name, level: subject.level },
            classIds: (subject.classIds || []).map(c => classMap[c.toString()] || { _id: c, name: c.toString() }),
          });
        }
      }
    }
    t.subjectIds = resolved;
  }

  return teachers;
}

module.exports = {
  getTeachers,
  createTeacher,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getTeacherSubjects,
};
