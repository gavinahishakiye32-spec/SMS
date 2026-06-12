const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Report = require('../models/Report');
const Mark = require('../models/Mark');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const PDFDocument = require('pdfkit');

const getStudentReport = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { termId, academicYearId } = req.query;
  const student = await Student.findById(studentId)
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
    if (teacher) {
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
  }
  let query = { studentId };
  if (termId) query.termId = termId;
  if (academicYearId) query.academicYearId = academicYearId;
  const report = await Report.findOne(query)
    .populate('termId', 'name')
    .populate('academicYearId', 'year');
  if (!report) {
    return res.json({
      success: true,
      message: 'No report found for this student/term',
      data: null,
    });
  }
  const marks = await Mark.find({ studentId, termId: report.termId, academicYearId: report.academicYearId })
    .populate('subjectId', 'name level')
    .sort({ 'subjectId.name': 1 });
  return res.json({
    success: true,
    data: { student, report, marks },
  });
});

const getClassReport = asyncHandler(async (req, res) => {
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
          message: 'You do not have permission to view reports for this class',
        });
      }
    }
  }
  const { termId, academicYearId } = req.query;
  let query = { classId };
  if (termId) query.termId = termId;
  if (academicYearId) query.academicYearId = academicYearId;
  const reports = await Report.find(query)
    .populate('studentId', 'firstName lastName studentCode')
    .populate('termId', 'name')
    .sort({ overallAverage: -1 })
    .limit(200);
  return res.json({ success: true, data: reports });
});

const getSchoolReport = asyncHandler(async (req, res) => {
  const { termId, academicYearId, level } = req.query;
  let query = {};
  if (termId) query.termId = termId;
  if (academicYearId) query.academicYearId = academicYearId;

  if (level) {
    const classIds = await Class.find({ level }).select('_id').lean();
    query.classId = { $in: classIds.map(c => c._id) };
  }

  const reports = await Report.find(query)
    .populate('studentId', 'firstName lastName studentCode classId')
    .populate('termId', 'name')
    .sort({ overallAverage: -1 })
    .limit(200);
  return res.json({ success: true, data: reports });
});

const searchReports = asyncHandler(async (req, res) => {
  const { q, classId, termId, academicYearId } = req.query;

  let studentQuery = {};
  if (q) {
    studentQuery.$or = [
      { firstName: { $regex: q, $options: 'i' } },
      { lastName: { $regex: q, $options: 'i' } },
      { studentCode: { $regex: q, $options: 'i' } },
    ];
    if (mongoose.Types.ObjectId.isValid(q)) {
      studentQuery.$or.push({ _id: q });
    }
  }
  if (classId) {
    studentQuery.classId = classId;
  }
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user._id }).populate({ path: 'subjectIds', select: 'classIds' });
    if (teacher) {
      const classIdSet = new Set();
      for (const subject of teacher.subjectIds) {
        for (const cid of subject.classIds) classIdSet.add(cid.toString());
      }
      const allowedClassIds = [...classIdSet];
      const specificClassId = typeof studentQuery.classId === 'string' ? studentQuery.classId : null;
      if (specificClassId) {
        if (!allowedClassIds.includes(specificClassId)) {
          return res.status(403).json({ success: false, message: 'You do not have permission to search reports for this class' });
        }
      } else if (allowedClassIds.length > 0) {
        studentQuery.classId = { $in: allowedClassIds };
      } else {
        studentQuery.classId = { $in: [] };
      }
    }
  }

  const students = await Student.find(studentQuery)
    .populate('classId', 'name level')
    .populate('sectionId', 'name')
    .limit(20);

  if (!students.length) {
    return res.json({ success: true, data: [] });
  }

  let reportQuery = {
    studentId: { $in: students.map((s) => s._id) },
  };
  if (termId) reportQuery.termId = termId;
  if (academicYearId) reportQuery.academicYearId = academicYearId;

  const reports = await Report.find(reportQuery)
    .populate('termId', 'name')
    .populate('academicYearId', 'year');

  const reportMap = {};
  reports.forEach((r) => {
    const key = r.studentId.toString();
    if (!reportMap[key]) reportMap[key] = [];
    reportMap[key].push(r);
  });

  const data = students.map((s) => ({
    student: s,
    reports: reportMap[s._id.toString()] || [],
  }));

  return res.json({ success: true, data });
});

const getStudentReportPdf = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const student = await Student.findById(studentId).select('userId classId').lean();
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found',
    });
  }
  if (req.user.role === 'student' && req.user._id.toString() !== (student.userId || '').toString()) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to download this report',
    });
  }
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user._id }).populate({ path: 'subjectIds', select: 'classIds' });
    if (teacher) {
      const classIdSet = new Set();
      for (const subject of teacher.subjectIds) {
        for (const cid of subject.classIds) classIdSet.add(cid.toString());
      }
      if (!classIdSet.has(student.classId?.toString())) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to download this report',
        });
      }
    }
  }
  const reportData = await getStudentReportData(studentId, req.query);
  if (!reportData) {
    return res.status(404).json({
      success: false,
      message: 'Report not found',
    });
  }
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=report_${studentId}.pdf`);
  doc.pipe(res);

  const pageWidth = doc.page.width - 80;
  const leftMargin = 40;
  let y;

  function header(text, size) {
    doc.fontSize(size).font('Helvetica-Bold').text(text, { align: 'center' });
    doc.font('Helvetica');
  }

  function drawLine(yPos) {
    doc.moveTo(leftMargin, yPos).lineTo(leftMargin + pageWidth, yPos).stroke();
  }

  header('SCHOOL MANAGEMENT SYSTEM', 18);
  doc.fontSize(12).text('STUDENT REPORT CARD', { align: 'center' });
  drawLine(doc.y + 4);
  doc.moveDown(1.5);

  const s = reportData.student;
  const r = reportData.report;
  doc.fontSize(11);
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '';
  doc.text(`Student: ${s.firstName} ${s.lastName}`, leftMargin, doc.y, { continued: true });
  doc.text(`Code: ${s.studentCode}`, { align: 'right' });
  const birthInfo = s.dateOfBirth ? `  |  DOB: ${fmt(s.dateOfBirth)}` : '';
  doc.text(`Class: ${s.classId ? s.classId.name : 'N/A'}${s.sectionId ? '  |  Section: ' + s.sectionId.name : ''}${birthInfo}`);
  const termDates = r && r.termId && r.termId.startDate
    ? `${fmt(r.termId.startDate)} - ${fmt(r.termId.endDate)}`
    : '';
  doc.text(`Term: ${r && r.termId ? r.termId.name : 'N/A'}  |  Year: ${r && r.academicYearId ? r.academicYearId.year : 'N/A'}`);
  if (termDates) doc.text(`Term Dates: ${termDates}`);
  doc.moveDown(1);

  drawLine(doc.y + 4);
  doc.moveDown(0.5);
  header('Academic Performance', 12);
  doc.moveDown(0.3);

  const tableTop = doc.y;
  const col1 = leftMargin;
  const col2 = leftMargin + 140;
  const col3 = leftMargin + 250;
  const col4 = leftMargin + 330;
  const col5 = leftMargin + 420;
  const rowH = 16;

  doc.fontSize(9).font('Helvetica-Bold');
  doc.text('Subject', col1, tableTop);
  doc.text('Mid-Term/100', col2, tableTop, { width: 60, align: 'center' });
  doc.text('End-Term/100', col3, tableTop, { width: 60, align: 'center' });
  doc.text('Average', col4, tableTop, { width: 60, align: 'center' });
  doc.text('Grade', col5, tableTop, { width: 50, align: 'center' });
  doc.font('Helvetica');
  doc.moveDown(0.3);
  drawLine(doc.y + 2);

  let rowY = tableTop + rowH + 4;
  const marks = reportData.marks || [];
  marks.forEach((m, i) => {
    doc.fontSize(9);
    doc.text(m.subjectId ? m.subjectId.name : 'N/A', col1, rowY);
    doc.text(m.midtermMarks != null ? String(m.midtermMarks) : '-', col2, rowY, { width: 60, align: 'center' });
    doc.text(m.endTermMarks != null ? String(m.endTermMarks) : '-', col3, rowY, { width: 60, align: 'center' });
    doc.text(m.subjectAverage != null ? m.subjectAverage.toFixed(0) : '-', col4, rowY, { width: 60, align: 'center' });
    doc.text(m.grade || '-', col5, rowY, { width: 50, align: 'center' });
    rowY += rowH;
    if ((i + 1) % 2 === 0) {
      doc.rect(col1, rowY - rowH, pageWidth, rowH).fillOpacity(0.05).fillAndStroke('#ddd', '#ddd').fillOpacity(1);
      doc.font('Helvetica');
    }
  });

  drawLine(rowY + 2);
  doc.y = rowY + 10;

  if (r) {
    doc.moveDown(1);
    drawLine(doc.y + 2);
    doc.moveDown(0.3);
    header('OVERALL PERFORMANCE', 12);
    doc.moveDown(0.3);
    doc.fontSize(10);
    const totalLabel = `Total Marks: ${((r.midtermTotal || 0) + (r.endTermTotal || 0)).toFixed(0)}`;
    const avgLabel = `Average: ${r.overallAverage ? r.overallAverage.toFixed(0) : '0'}`;
    const rankLabel = `Class Position: ${r.classRank || '?'}${r.totalStudentsInClass != null ? ' out of ' + r.totalStudentsInClass : ''}`;
    const schoolRankLabel = `School Position: ${r.schoolRank || '?'}${r.totalStudentsInSchool != null ? ' out of ' + r.totalStudentsInSchool : ''}`;
    doc.text(`${totalLabel}    |    ${avgLabel}`);
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(11);
    doc.text(`Result: ${r.grade}   |   ${rankLabel}   |   ${schoolRankLabel}`, { align: 'center' });
    doc.moveDown(0.2);
    const passed = r.remarks === 'Pass';
    doc.fontSize(12);
    doc.fillColor(passed ? 'green' : 'red');
    doc.text(passed ? 'PASSED' : 'FAILED', { align: 'center' });
    doc.fillColor('black');
    doc.font('Helvetica');
    drawLine(doc.y + 4);
    doc.moveDown(0.5);
  }

  if (r && r.teacherRemark) {
    doc.fontSize(10).font('Helvetica-Bold').text("Teacher's Encouragement:", leftMargin, doc.y);
    doc.font('Helvetica');
    doc.moveDown(0.3);
    doc.fontSize(10).text(`"${r.teacherRemark}"`, leftMargin + 10, doc.y, { indent: 0 });
    doc.moveDown(0.5);
  } else {
    doc.moveDown(0.5);
  }

  doc.moveDown(1.5);
  const sigY = doc.y;
  doc.fontSize(10);
  doc.text('_________________________', leftMargin, sigY);
  doc.text('_________________________', leftMargin + pageWidth - 170, sigY);
  doc.moveDown(0.3);
  doc.text('Class Teacher Signature', leftMargin, doc.y);
  doc.text('Head Teacher Signature', leftMargin + pageWidth - 170, doc.y);

  doc.end();
});

const updateReportRemark = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const { teacherRemark } = req.body;
  const report = await Report.findById(reportId);
  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found',
    });
  }
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user._id }).populate({ path: 'subjectIds', select: 'classIds' });
    if (teacher) {
      const classIdSet = new Set();
      for (const subject of teacher.subjectIds) {
        for (const cid of subject.classIds) classIdSet.add(cid.toString());
      }
      if (!classIdSet.has(report.classId?.toString())) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update remarks for this report',
        });
      }
    }
  }
  if (teacherRemark !== undefined) report.teacherRemark = teacherRemark || '';
  if (req.body.headTeacherSignature !== undefined) report.headTeacherSignature = req.body.headTeacherSignature || '';
  const updated = await report.save();
  return res.json({
    success: true,
    message: 'Remarks and signature updated successfully',
    data: updated,
  });
});

async function getStudentReportData(studentId, query = {}) {
  const { termId, academicYearId } = query;
  const student = await Student.findById(studentId)
    .populate('classId', 'name level')
    .populate('sectionId', 'name')
    .populate('academicYearId', 'year');
  if (!student) return null;
  let reportQuery = { studentId };
  if (termId) reportQuery.termId = termId;
  if (academicYearId) reportQuery.academicYearId = academicYearId;
  const report = await Report.findOne(reportQuery)
    .populate('termId', 'name startDate endDate')
    .populate('academicYearId', 'year');
  if (!report) return null;
  const marks = await Mark.find({ studentId, termId: report.termId, academicYearId: report.academicYearId })
    .populate('subjectId', 'name level');
  return { student, report, marks };
}

module.exports = {
  getStudentReport,
  searchReports,
  getClassReport,
  getSchoolReport,
  getStudentReportPdf,
  updateReportRemark,
};
