const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createTestApp, TEST_SECRET } = require('./helpers');
const AcademicYear = require('../models/AcademicYear');
const Term = require('../models/Term');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Mark = require('../models/Mark');
const Report = require('../models/Report');
const User = require('../models/User');

let app;
let token;

beforeAll(async () => {
  process.env.JWT_SECRET = TEST_SECRET;
  app = createTestApp();
  app.use('/api/marks', require('../routes/markRoutes'));
  app.use('/api/students', require('../routes/studentRoutes'));
  app.use('/api/reports', require('../routes/reportRoutes'));

  const user = await User.create({
    name: 'Super Admin',
    email: 'super@admin.com',
    password: 'password123',
    role: 'superadmin',
  });
  token = jwt.sign({ id: user._id }, TEST_SECRET, { expiresIn: '1h' });
});

describe('Academic Year Filter Integration Tests', () => {
  let year1, year2, term1, term2, subject, cls, student1, student2;

  beforeEach(async () => {
    year1 = await AcademicYear.create({ year: '2024', isActive: true });
    year2 = await AcademicYear.create({ year: '2025', isActive: false });

    term1 = await Term.create({ name: 'Term 1', academicYearId: year1._id, startDate: new Date('2024-01-01'), endDate: new Date('2024-03-31') });
    term2 = await Term.create({ name: 'Term 2', academicYearId: year2._id, startDate: new Date('2025-01-01'), endDate: new Date('2025-03-31') });

    subject = await Subject.create({ name: 'Mathematics', code: 'MATH', level: 'O-Level' });
    cls = await Class.create({ name: 'S1', level: 'O-Level' });

    student1 = await Student.create({ firstName: 'Alice', lastName: 'Smith', gender: 'Female', studentCode: 'STU001', classId: cls._id });
    student2 = await Student.create({ firstName: 'Bob', lastName: 'Jones', gender: 'Male', studentCode: 'STU002', classId: cls._id });

    await Mark.create({
      studentId: student1._id, subjectId: subject._id, classId: cls._id,
      termId: term1._id, academicYearId: year1._id, teacherId: new mongoose.Types.ObjectId(),
      midtermMarks: 80, endTermMarks: 90,
    });

    await Mark.create({
      studentId: student1._id, subjectId: subject._id, classId: cls._id,
      termId: term2._id, academicYearId: year2._id, teacherId: new mongoose.Types.ObjectId(),
      midtermMarks: 70, endTermMarks: 75,
    });

    await Report.create({
      studentId: student1._id, classId: cls._id,
      termId: term1._id, academicYearId: year1._id,
      overallAverage: 85, grade: 'A', remarks: 'Pass',
      midtermTotal: 80, endTermTotal: 90, classRank: 1, totalStudentsInClass: 2, schoolRank: 1, totalStudentsInSchool: 2,
    });

    await Report.create({
      studentId: student1._id, classId: cls._id,
      termId: term2._id, academicYearId: year2._id,
      overallAverage: 72.5, grade: 'B', remarks: 'Pass',
      midtermTotal: 70, endTermTotal: 75, classRank: 1, totalStudentsInClass: 2, schoolRank: 1, totalStudentsInSchool: 2,
    });
  });

  function authGet(url) {
    return request(app).get(url).set('Authorization', `Bearer ${token}`);
  }

  describe('GET /api/marks (list marks)', () => {
    it('returns all marks when no academicYearId filter', async () => {
      const res = await authGet('/api/marks?limit=100');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('filters marks by academicYearId', async () => {
      const res = await authGet(`/api/marks?academicYearId=${year1._id}&limit=100`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });

    it('filters marks by year2', async () => {
      const res = await authGet(`/api/marks?academicYearId=${year2._id}&limit=100`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });

    it('returns empty when academicYearId matches no marks', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await authGet(`/api/marks?academicYearId=${fakeId}&limit=100`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });

    it('filters by classId + academicYearId together', async () => {
      const res = await authGet(`/api/marks?classId=${cls._id}&academicYearId=${year1._id}&limit=100`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });

    it('filters by subjectId + termId + academicYearId together', async () => {
      const res = await authGet(`/api/marks?subjectId=${subject._id}&termId=${term1._id}&academicYearId=${year1._id}&limit=100`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('GET /api/marks/student/:studentId', () => {
    it('returns all student marks when no filter', async () => {
      const res = await authGet(`/api/marks/student/${student1._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('filters student marks by academicYearId', async () => {
      const res = await authGet(`/api/marks/student/${student1._id}?academicYearId=${year1._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });

    it('filters student marks by year2', async () => {
      const res = await authGet(`/api/marks/student/${student1._id}?academicYearId=${year2._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });

    it('returns empty for student with no marks in year', async () => {
      const res = await authGet(`/api/marks/student/${student2._id}?academicYearId=${year1._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });

    it('filters by termId + academicYearId together', async () => {
      const res = await authGet(`/api/marks/student/${student1._id}?termId=${term1._id}&academicYearId=${year1._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });

    it('returns no marks when term and year mismatch', async () => {
      const res = await authGet(`/api/marks/student/${student1._id}?termId=${term1._id}&academicYearId=${year2._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });

  describe('GET /api/students/:id/ranking', () => {
    beforeEach(async () => {
      await Report.create({
        studentId: student2._id, classId: cls._id,
        termId: term1._id, academicYearId: year1._id,
        overallAverage: 90, grade: 'A', remarks: 'Pass',
        midtermTotal: 85, endTermTotal: 95, classRank: 2, totalStudentsInClass: 2, schoolRank: 2, totalStudentsInSchool: 2,
      });
    });

    it('returns ranking without year filter', async () => {
      const res = await authGet(`/api/students/${student1._id}/ranking`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('rank');
      expect(res.body.data).toHaveProperty('total');
    });

    it('returns ranking filtered by academicYearId', async () => {
      const res = await authGet(`/api/students/${student1._id}/ranking?academicYearId=${year1._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(2);
    });

    it('returns no ranking data for year with no reports', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await authGet(`/api/students/${student1._id}/ranking?academicYearId=${fakeId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(0);
    });

    it('filters by termId + academicYearId together', async () => {
      const res = await authGet(`/api/students/${student1._id}/ranking?termId=${term1._id}&academicYearId=${year1._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(2);
    });
  });

  describe('GET /api/reports/student/:studentId', () => {
    it('returns report without year filter', async () => {
      const res = await authGet(`/api/reports/student/${student1._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data).not.toBeNull();
    });

    it('returns report filtered by academicYearId', async () => {
      const res = await authGet(`/api/reports/student/${student1._id}?academicYearId=${year1._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.report.academicYearId?.year).toBe('2024');
    });

    it('returns null for year with no report', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await authGet(`/api/reports/student/${student1._id}?academicYearId=${fakeId}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });

    it('filters by termId + academicYearId together', async () => {
      const res = await authGet(`/api/reports/student/${student1._id}?termId=${term2._id}&academicYearId=${year2._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.report.academicYearId?.year).toBe('2025');
    });
  });
});
