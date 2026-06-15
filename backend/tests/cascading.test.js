const mongoose = require('mongoose');
const request = require('supertest');
const { createTestApp, TEST_SECRET } = require('./helpers');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Mark = require('../models/Mark');
const Report = require('../models/Report');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Section = require('../models/Section');
const AcademicYear = require('../models/AcademicYear');
const Term = require('../models/Term');
const Parent = require('../models/Parent');
const Suggestion = require('../models/Suggestion');
const SchoolSetting = require('../models/SchoolSetting');

const { seedComprehensiveData } = require('./seed-data');

let app;
let data;

beforeAll(async () => {
  process.env.JWT_SECRET = TEST_SECRET;
  app = createTestApp();

  app.use('/api/auth', require('../routes/authRoutes'));
  app.use('/api/users', require('../routes/userRoutes'));
  app.use('/api/students', require('../routes/studentRoutes'));
  app.use('/api/teachers', require('../routes/teacherRoutes'));
  app.use('/api/parents', require('../routes/parentRoutes'));
  app.use('/api/classes', require('../routes/classRoutes'));
  app.use('/api/sections', require('../routes/sectionRoutes'));
  app.use('/api/subjects', require('../routes/subjectRoutes'));
  app.use('/api/marks', require('../routes/markRoutes'));
  app.use('/api/academic-years', require('../routes/academicYearRoutes'));
  app.use('/api/terms', require('../routes/termRoutes'));
  app.use('/api/settings', require('../routes/settingRoutes'));
  app.use('/api/suggestions', require('../routes/suggestionRoutes'));
  app.use('/api/analytics', require('../routes/analyticsRoutes'));
  app.use('/api/reports', require('../routes/reportRoutes'));

  data = await seedComprehensiveData('casc');
});

describe('Cascade – Delete Student', () => {
  it('deletes student + linked User + Marks + Reports', async () => {
    // Create a fresh student+user to delete
    const user = await User.create({ name: 'Cascade Student', email: 'cascade-student@test.com', password: 'pass123', role: 'student' });
    const student = await Student.create({
      userId: user._id, studentCode: 'CAS001', firstName: 'Cascade', lastName: 'Test',
      gender: 'Male', classId: data.classes.S1._id,
    });
    const mark = await Mark.create({
      studentId: student._id, subjectId: data.subjects.math._id,
      teacherId: data.teacher.jane._id, classId: data.classes.S1._id,
      termId: data.terms.term1_2024._id, academicYearId: data.years.y2024._id,
      midtermMarks: 50, endTermMarks: 60,
    });
    const report = await Report.create({
      studentId: student._id, classId: data.classes.S1._id,
      termId: data.terms.term1_2024._id, academicYearId: data.years.y2024._id,
      overallAverage: 55, remarks: 'Pass',
    });

    const res = await request(app).delete(`/api/students/${student._id}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    expect(res.status).toBe(200);

    const userAfter = await User.findById(user._id);
    expect(userAfter).toBeNull();
    const markAfter = await Mark.findById(mark._id);
    expect(markAfter).toBeNull();
    const reportAfter = await Report.findById(report._id);
    expect(reportAfter).toBeNull();
  });
});

describe('Cascade – Delete Teacher', () => {
  it('deletes teacher + linked User', async () => {
    const user = await User.create({ name: 'Cascade Teacher', email: 'cascade-teacher@test.com', password: 'pass123', role: 'teacher' });
    const teacher = await Teacher.create({
      userId: user._id, firstName: 'Cascade', lastName: 'Teacher',
      email: 'cascade-teacher@test.com', gender: 'Male',
    });

    const res = await request(app).delete(`/api/teachers/${teacher._id}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    expect(res.status).toBe(200);

    const userAfter = await User.findById(user._id);
    expect(userAfter).toBeNull();
  });
});

describe('Cascade – Delete Class', () => {
  it('deletes class + cascades Marks + Reports, unlinks students', async () => {
    const cls = await Class.create({ name: 'S3', level: 'O-Level', academicYearId: data.years.y2024._id });
    const student = await Student.create({
      studentCode: 'CASC003', firstName: 'ClassCascade', lastName: 'Test',
      gender: 'Male', classId: cls._id,
    });
    const mark = await Mark.create({
      studentId: student._id, subjectId: data.subjects.math._id,
      teacherId: data.teacher.jane._id, classId: cls._id,
      termId: data.terms.term1_2024._id, academicYearId: data.years.y2024._id,
      midtermMarks: 50, endTermMarks: 60,
    });
    const report = await Report.create({
      studentId: student._id, classId: cls._id,
      termId: data.terms.term1_2024._id, academicYearId: data.years.y2024._id,
      overallAverage: 55, remarks: 'Pass',
    });

    const res = await request(app).delete(`/api/classes/${cls._id}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    expect(res.status).toBe(200);

    const studentAfter = await Student.findById(student._id);
    expect(studentAfter.classId).toBeNull();

    const markAfter = await Mark.findById(mark._id);
    expect(markAfter).toBeNull();
    const reportAfter = await Report.findById(report._id);
    expect(reportAfter).toBeNull();
  });
});

describe('Cascade – Delete Subject', () => {
  it('deletes subject + cascades Marks + removes from Teacher.subjectIds', async () => {
    const subj = await Subject.create({ name: 'Temporary Subject', level: 'O-Level', classIds: [data.classes.S1._id] });
    const mark = await Mark.create({
      studentId: data.students.Alice._id, subjectId: subj._id,
      teacherId: data.teacher.jane._id, classId: data.classes.S1._id,
      termId: data.terms.term1_2024._id, academicYearId: data.years.y2024._id,
      midtermMarks: 50, endTermMarks: 60,
    });

    const res = await request(app).delete(`/api/subjects/${subj._id}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    expect(res.status).toBe(200);

    const markAfter = await Mark.findById(mark._id);
    expect(markAfter).toBeNull();
  });
});

describe('Cascade – Delete Term', () => {
  it('deletes term + cascades Marks + Reports', async () => {
    const term = await Term.create({ name: 'Term 3', academicYearId: data.years.y2024._id, startDate: new Date(), endDate: new Date() });
    const mark = await Mark.create({
      studentId: data.students.Alice._id, subjectId: data.subjects.math._id,
      teacherId: data.teacher.jane._id, classId: data.classes.S1._id,
      termId: term._id, academicYearId: data.years.y2024._id,
      midtermMarks: 50, endTermMarks: 60,
    });
    const report = await Report.create({
      studentId: data.students.Alice._id, classId: data.classes.S1._id,
      termId: term._id, academicYearId: data.years.y2024._id,
      overallAverage: 55, remarks: 'Pass',
    });

    const res = await request(app).delete(`/api/terms/${term._id}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    expect(res.status).toBe(200);

    const markAfter = await Mark.findById(mark._id);
    expect(markAfter).toBeNull();
    const reportAfter = await Report.findById(report._id);
    expect(reportAfter).toBeNull();
  });
});

describe('Cascade – Delete Academic Year (with confirm)', () => {
  it('deletes year + cascades Terms + Marks + Reports, unlinks Classes and Students', async () => {
    const year = await AcademicYear.create({ year: '2999', isActive: false });
    const cls = await Class.create({ name: 'S1', level: 'O-Level', academicYearId: year._id });
    const term = await Term.create({ name: 'Term 1', academicYearId: year._id, startDate: new Date(), endDate: new Date() });
    const student = await Student.create({
      studentCode: 'CAS2999', firstName: 'YearCascade', lastName: 'Test',
      gender: 'Male', classId: cls._id, academicYearId: year._id,
    });
    const mark = await Mark.create({
      studentId: student._id, subjectId: data.subjects.math._id,
      teacherId: data.teacher.jane._id, classId: cls._id,
      termId: term._id, academicYearId: year._id,
      midtermMarks: 50, endTermMarks: 60,
    });
    const report = await Report.create({
      studentId: student._id, classId: cls._id, termId: term._id,
      academicYearId: year._id, overallAverage: 55, remarks: 'Pass',
    });

    const res = await request(app).delete(`/api/academic-years/${year._id}?confirm=true`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    expect(res.status).toBe(200);

    expect(await Term.findById(term._id)).toBeNull();
    expect(await Mark.findById(mark._id)).toBeNull();
    expect(await Report.findById(report._id)).toBeNull();
    // Class is NOT deleted; its academicYearId gets $unset (field removed)
    const classAfter = await Class.findById(cls._id);
    expect(classAfter.academicYearId).toBeUndefined();
    const studentAfter = await Student.findById(student._id);
    expect(studentAfter.academicYearId).toBeNull();
  });
});

describe('Cascade – Delete User', () => {
  it('deletes user + linked Teacher (teacher role)', async () => {
    const user = await User.create({ name: 'Cascade Teacher', email: 'cascade-delteacher@casc.test', password: 'pass123', role: 'teacher' });
    const teacher = await Teacher.create({
      userId: user._id, firstName: 'Cascade', lastName: 'Teacher',
      email: 'cascade-delteacher@casc.test', gender: 'Male',
    });

    const res = await request(app).delete(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    expect(res.status).toBe(200);

    expect(await Teacher.findById(teacher._id)).toBeNull();
  });


});

describe('Cascade – Delete Section', () => {
  it('deletes section and unlinks students', async () => {
    const section = await Section.create({ name: 'Z', level: 'O-Level' });
    const student = await Student.create({
      studentCode: 'CASSEC', firstName: 'SectionCascade', lastName: 'Test',
      gender: 'Male', classId: data.classes.S1._id, sectionId: section._id,
    });

    const res = await request(app).delete(`/api/sections/${section._id}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    expect(res.status).toBe(200);

    const studentAfter = await Student.findById(student._id);
    expect(studentAfter.sectionId).toBeNull();
  });
});
