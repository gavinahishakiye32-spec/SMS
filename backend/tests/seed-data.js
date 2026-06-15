const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const Class = require('../models/Class');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const Mark = require('../models/Mark');
const Report = require('../models/Report');
const AcademicYear = require('../models/AcademicYear');
const Term = require('../models/Term');
const SchoolSetting = require('../models/SchoolSetting');
const Suggestion = require('../models/Suggestion');

async function seedComprehensiveData(suffix = 'seed') {
  // ── Users (all roles) ──────────────────────────────────
  const superadmin = await User.create({
    name: 'Super Admin', email: `super@${suffix}.test`, password: 'pass123', role: 'superadmin',
  });
  const schooladmin = await User.create({
    name: 'School Admin', email: `admin@${suffix}.test`, password: 'pass123', role: 'schooladmin',
  });
  const teacherUser = await User.create({
    name: 'Teacher Jane', email: `teacher@${suffix}.test`, password: 'pass123', role: 'teacher',
  });
  const teacherUser2 = await User.create({
    name: 'Teacher Bob', email: `teacher2@${suffix}.test`, password: 'pass123', role: 'teacher',
  });
  const studentUser = await User.create({
    name: 'Student Alice', email: `student@${suffix}.test`, password: 'pass123', role: 'student',
  });

  // ── Academic Years ─────────────────────────────────────
  const year2024 = await AcademicYear.create({ year: '2024', isActive: true });
  const year2025 = await AcademicYear.create({ year: '2025', isActive: false });

  // ── Terms ──────────────────────────────────────────────
  const term1_2024 = await Term.create({
    name: 'Term 1', academicYearId: year2024._id,
    startDate: new Date('2024-01-15'), endDate: new Date('2024-04-15'), isActive: true,
  });
  const term2_2024 = await Term.create({
    name: 'Term 2', academicYearId: year2024._id,
    startDate: new Date('2024-05-15'), endDate: new Date('2024-08-15'), isActive: false,
  });
  const term1_2025 = await Term.create({
    name: 'Term 1', academicYearId: year2025._id,
    startDate: new Date('2025-01-15'), endDate: new Date('2025-04-15'), isActive: false,
  });

  // ── Classes (S1-S6) ────────────────────────────────────
  const classes = {};
  for (const name of ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']) {
    const level = ['S5', 'S6'].includes(name) ? 'A-Level' : 'O-Level';
    classes[name] = await Class.create({ name, level, academicYearId: year2024._id });
  }

  // ── Sections ───────────────────────────────────────────
  const sectionO = await Section.create({ name: 'A', level: 'O-Level' });
  const sectionA = await Section.create({ name: 'A', level: 'A-Level' });

  // ── Subjects ───────────────────────────────────────────
  const math = await Subject.create({ name: 'Mathematics', level: 'O-Level', classIds: [classes.S1._id, classes.S2._id] });
  const english = await Subject.create({ name: 'English', level: 'O-Level', classIds: [classes.S1._id, classes.S2._id] });
  const physics = await Subject.create({ name: 'Physics', level: 'A-Level', classIds: [classes.S5._id, classes.S6._id] });
  const chemistry = await Subject.create({ name: 'Chemistry', level: 'A-Level', classIds: [classes.S5._id, classes.S6._id] });

  // ── Teachers ───────────────────────────────────────────
  const teacher = await Teacher.create({
    userId: teacherUser._id, firstName: 'Jane', lastName: 'Smith',
    email: 'teacher@seed.test', gender: 'Female',
    subjectIds: [
      { subjectId: math._id, classIds: [classes.S1._id, classes.S2._id] },
      { subjectId: english._id, classIds: [classes.S1._id] },
    ],
  });
  const teacher2 = await Teacher.create({
    userId: teacherUser2._id, firstName: 'Bob', lastName: 'Jones',
    email: 'teacher2@seed.test', gender: 'Male',
    subjectIds: [
      { subjectId: physics._id, classIds: [classes.S5._id] },
      { subjectId: chemistry._id, classIds: [classes.S5._id] },
    ],
  });
  // Teacher with no subjects (edge case)
  const teacherNoSubjects = await User.create({
    name: 'Teacher Nobody', email: `teacher-nobody@${suffix}.test`, password: 'pass123', role: 'teacher',
  });
  await Teacher.create({
    userId: teacherNoSubjects._id, firstName: 'Nobody', lastName: 'Nowhere',
    email: `teacher-nobody@${suffix}.test`, gender: 'Male',
    subjectIds: [],
  });

  // ── Students ───────────────────────────────────────────
  const students = {};
  const studentData = [
    { code: 'SMS2024001', firstName: 'Alice', lastName: 'Wonder', gender: 'Female', cls: 'S1', year: year2024._id },
    { code: 'SMS2024002', firstName: 'Bob', lastName: 'Builder', gender: 'Male', cls: 'S1', year: year2024._id },
    { code: 'SMS2024003', firstName: 'Charlie', lastName: 'Chaplin', gender: 'Male', cls: 'S2', year: year2024._id },
    { code: 'SMS2024004', firstName: 'Diana', lastName: 'Prince', gender: 'Female', cls: 'S5', year: year2024._id },
    { code: 'SMS2024005', firstName: 'Eve', lastName: 'Adams', gender: 'Female', cls: 'S6', year: year2024._id },
    { code: 'SMS2024006', firstName: 'Frank', lastName: 'Castle', gender: 'Male', cls: 'S1', year: year2024._id },
    // Student in a different academic year
    { code: 'SMS2025001', firstName: 'Grace', lastName: 'Hopper', gender: 'Female', cls: 'S1', year: year2025._id },
    // Student with NO academicYearId (null – legacy data)
    { code: 'SMS2024007', firstName: 'Henry', lastName: 'Null', gender: 'Male', cls: 'S2', year: null },
  ];
  for (const sd of studentData) {
    const student = await Student.create({
      userId: studentUser._id, studentCode: sd.code,
      firstName: sd.firstName, lastName: sd.lastName, gender: sd.gender,
      classId: classes[sd.cls]._id, sectionId: sd.cls.startsWith('S5') || sd.cls.startsWith('S6') ? sectionA._id : sectionO._id,
      academicYearId: sd.year,
      phoneNumber: '0788000000', NIN: `NIN${sd.code}`,
    });
    students[sd.firstName] = student;
  }

  // ── Marks ──────────────────────────────────────────────
  const mark1 = await Mark.create({
    studentId: students.Alice._id, subjectId: math._id,
    teacherId: teacher._id, classId: classes.S1._id,
    sectionId: sectionO._id, termId: term1_2024._id, academicYearId: year2024._id,
    midtermMarks: 80, endTermMarks: 90,
  });
  const mark2 = await Mark.create({
    studentId: students.Alice._id, subjectId: english._id,
    teacherId: teacher._id, classId: classes.S1._id,
    sectionId: sectionO._id, termId: term1_2024._id, academicYearId: year2024._id,
    midtermMarks: 70, endTermMarks: 75,
  });
  const mark3 = await Mark.create({
    studentId: students.Bob._id, subjectId: math._id,
    teacherId: teacher._id, classId: classes.S1._id,
    sectionId: sectionO._id, termId: term1_2024._id, academicYearId: year2024._id,
    midtermMarks: 50, endTermMarks: 60,
  });

  // ── Reports (auto-generated by mark pre-save hooks, but create explicit ones) ──
  const report1 = await Report.create({
    studentId: students.Alice._id, classId: classes.S1._id, sectionId: sectionO._id,
    termId: term1_2024._id, academicYearId: year2024._id,
    midtermTotal: 150, midtermAverage: 75,
    endTermTotal: 165, endTermAverage: 82.5,
    combinedTotal: 315, overallAverage: 78.75,
    grade: 'B', remarks: 'Pass', classRank: 1, totalStudentsInClass: 2,
  });
  const report2 = await Report.create({
    studentId: students.Bob._id, classId: classes.S1._id, sectionId: sectionO._id,
    termId: term1_2024._id, academicYearId: year2024._id,
    midtermTotal: 50, midtermAverage: 50,
    endTermTotal: 60, endTermAverage: 60,
    combinedTotal: 110, overallAverage: 55,
    grade: 'D', remarks: 'Pass', classRank: 2, totalStudentsInClass: 2,
  });

  // ── Parents ────────────────────────────────────────────
  const parent1 = await Parent.create({
    fullName: 'Parent One', parentType: 'Father',
    phoneNumber: '0788000001', email: 'parent1@seed.test',
    studentIds: [students.Alice._id, students.Bob._id],
  });
  const parent2 = await Parent.create({
    fullName: 'Parent Two', parentType: 'Mother',
    phoneNumber: '0788000002', email: 'parent2@seed.test',
    studentIds: [],
  });

  // ── Suggestions ────────────────────────────────────────
  const suggestion1 = await Suggestion.create({
    authorId: teacherUser._id, authorRole: 'teacher',
    title: 'Need more lab equipment', body: 'The physics lab lacks equipment for practical sessions.',
  });
  const suggestion2 = await Suggestion.create({
    authorId: teacherUser2._id, authorRole: 'teacher',
    title: 'Library hours', body: 'Should we extend library hours during exam season?',
  });

  // ── School Settings ────────────────────────────────────
  const setting = await SchoolSetting.create({ schoolName: 'Seed Test School' });

  return {
    userIds: { superadmin: superadmin._id, schooladmin: schooladmin._id, teacher: teacherUser._id, teacher2: teacherUser2._id, student: studentUser._id, teacherNoSubjects: teacherNoSubjects._id },
    tokens: {
      superadmin: require('jsonwebtoken').sign({ id: superadmin._id }, process.env.JWT_SECRET || 'test-secret-key', { expiresIn: '1h' }),
      schooladmin: require('jsonwebtoken').sign({ id: schooladmin._id }, process.env.JWT_SECRET || 'test-secret-key', { expiresIn: '1h' }),
      teacher: require('jsonwebtoken').sign({ id: teacherUser._id }, process.env.JWT_SECRET || 'test-secret-key', { expiresIn: '1h' }),
      student: require('jsonwebtoken').sign({ id: studentUser._id }, process.env.JWT_SECRET || 'test-secret-key', { expiresIn: '1h' }),
    },
    classes,
    sections: { O: sectionO, A: sectionA },
    years: { y2024: year2024, y2025: year2025 },
    terms: { term1_2024, term2_2024, term1_2025 },
    subjects: { math, english, physics, chemistry },
    teacher: { jane: teacher, bob: teacher2 },
    students,
    marks: [mark1, mark2, mark3],
    reports: [report1, report2],
    parents: [parent1, parent2],
    suggestions: [suggestion1, suggestion2],
    setting,
  };
}

module.exports = { seedComprehensiveData };
