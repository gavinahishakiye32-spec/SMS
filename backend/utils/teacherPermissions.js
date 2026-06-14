const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');

async function getTeacherClassIdSet(userId) {
  const teacher = await Teacher.findOne({ userId }).select('subjectIds').lean();
  if (!teacher || !teacher.subjectIds) return new Set();
  const set = new Set();
  const oldSubjectIds = [];
  for (const entry of teacher.subjectIds) {
    if (entry && typeof entry === 'object' && entry.subjectId) {
      for (const cid of entry.classIds || []) set.add(cid.toString());
    } else {
      const sid = entry?.toString();
      if (sid) oldSubjectIds.push(sid);
    }
  }
  if (oldSubjectIds.length > 0) {
    const subjects = await Subject.find({ _id: { $in: oldSubjectIds } }).select('classIds').lean();
    for (const subj of subjects) {
      for (const cid of subj.classIds || []) set.add(cid.toString());
    }
  }
  return set;
}

async function getTeacherSubjectIds(userId) {
  const teacher = await Teacher.findOne({ userId }).select('subjectIds').lean();
  if (!teacher || !teacher.subjectIds) return [];
  const ids = [];
  for (const entry of teacher.subjectIds) {
    if (entry && typeof entry === 'object' && entry.subjectId) {
      ids.push(entry.subjectId.toString());
    } else {
      const sid = entry?.toString();
      if (sid) ids.push(sid);
    }
  }
  return ids;
}

async function getTeacherSubjectClassIdSet(userId, subjectId) {
  const teacher = await Teacher.findOne({ userId }).select('subjectIds').lean();
  if (!teacher || !teacher.subjectIds) return new Set();
  const subjIdStr = subjectId.toString();
  for (const entry of teacher.subjectIds) {
    if (entry && typeof entry === 'object' && entry.subjectId) {
      if (entry.subjectId.toString() === subjIdStr) {
        return new Set((entry.classIds || []).map(c => c.toString()));
      }
    }
  }
  const hasOldFormat = teacher.subjectIds.some(e => !e || typeof e !== 'object' || !e.subjectId);
  if (hasOldFormat) {
    const subject = await Subject.findById(subjectId).select('classIds').lean();
    if (subject) return new Set((subject.classIds || []).map(c => c.toString()));
  }
  return new Set();
}

module.exports = { getTeacherClassIdSet, getTeacherSubjectIds, getTeacherSubjectClassIdSet };
