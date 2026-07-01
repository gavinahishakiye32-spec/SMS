const AcademicYear = require('../models/AcademicYear');
const Term = require('../models/Term');

async function getActiveAcademicYear() {
  return AcademicYear.findOne({ isActive: true });
}

async function getActiveTerm() {
  const activeYear = await getActiveAcademicYear();
  if (!activeYear) return null;
  return Term.findOne({ academicYearId: activeYear._id, isActive: true });
}

async function requireActiveAcademicYear() {
  const year = await getActiveAcademicYear();
  if (!year) {
    const err = new Error('No active academic year found. Please create and activate one first.');
    err.statusCode = 400;
    throw err;
  }
  return year;
}

async function resolveAcademicYear(providedId) {
  if (providedId) return providedId;
  const active = await getActiveAcademicYear();
  return active ? active._id : null;
}

async function resolveQueryAcademicYear(providedId) {
  if (providedId) return providedId;
  const active = await getActiveAcademicYear();
  return active ? active._id : undefined;
}

async function resolveQueryTerm(providedId, academicYearId) {
  if (providedId) return providedId;
  const activeTerm = await getActiveTerm();
  if (!activeTerm) return undefined;
  if (!academicYearId) return activeTerm._id;
  if (academicYearId.toString() === activeTerm.academicYearId.toString()) return activeTerm._id;
  return undefined;
}

module.exports = { getActiveAcademicYear, getActiveTerm, requireActiveAcademicYear, resolveAcademicYear, resolveQueryAcademicYear, resolveQueryTerm };
