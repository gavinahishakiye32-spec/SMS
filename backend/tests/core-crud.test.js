const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createTestApp, TEST_SECRET } = require('./helpers');
const AcademicYear = require('../models/AcademicYear');
const Term = require('../models/Term');
const Class = require('../models/Class');
const Section = require('../models/Section');
const User = require('../models/User');
const Mark = require('../models/Mark');
const Report = require('../models/Report');
const Student = require('../models/Student');

let app;
let token, teacherToken, studentToken;
let user;

beforeAll(async () => {
  process.env.JWT_SECRET = TEST_SECRET;
  app = createTestApp();
  app.use('/api/academic-years', require('../routes/academicYearRoutes'));
  app.use('/api/terms', require('../routes/termRoutes'));
  app.use('/api/classes', require('../routes/classRoutes'));
  app.use('/api/sections', require('../routes/sectionRoutes'));

  user = await User.create({ name: 'Super', email: 'super@crud.com', password: 'pass123', role: 'superadmin' });
  const teacherUser = await User.create({ name: 'Teacher', email: 't@crud.com', password: 'pass123', role: 'teacher' });
  const studentUser = await User.create({ name: 'Student', email: 's@crud.com', password: 'pass123', role: 'student' });
  token = jwt.sign({ id: user._id }, TEST_SECRET, { expiresIn: '1h' });
  teacherToken = jwt.sign({ id: teacherUser._id }, TEST_SECRET, { expiresIn: '1h' });
  studentToken = jwt.sign({ id: studentUser._id }, TEST_SECRET, { expiresIn: '1h' });
});

function auth(method, url) {
  const r = request(app)[method](url);
  return { set: (t) => r.set('Authorization', `Bearer ${t || token}`) };
}

describe('Academic Years', () => {
  it('POST /api/academic-years creates a year', async () => {
    const res = await request(app).post('/api/academic-years').set('Authorization', `Bearer ${token}`).send({ year: '2024' });
    expect(res.status).toBe(201);
    expect(res.body.data.year).toBe('2024');
  });

  it('POST /api/academic-years returns 409 for duplicate year', async () => {
    await request(app).post('/api/academic-years').set('Authorization', `Bearer ${token}`).send({ year: '2024' });
    const res = await request(app).post('/api/academic-years').set('Authorization', `Bearer ${token}`).send({ year: '2024' });
    expect(res.status).toBe(409);
  });

  it('POST /api/academic-years returns 400 for missing year', async () => {
    const res = await request(app).post('/api/academic-years').set('Authorization', `Bearer ${token}`).send({});
    expect(res.status).toBe(400);
  });

  it('GET /api/academic-years lists years', async () => {
    await AcademicYear.create({ year: '2024' });
    const res = await request(app).get('/api/academic-years').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/academic-years/:id returns a year', async () => {
    const year = await AcademicYear.create({ year: '2025' });
    const res = await request(app).get(`/api/academic-years/${year._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.year).toBe('2025');
  });

  it('GET /api/academic-years/:id returns 404', async () => {
    const res = await request(app).get(`/api/academic-years/${new mongoose.Types.ObjectId()}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('PUT /api/academic-years/:id updates a year', async () => {
    const year = await AcademicYear.create({ year: '2024' });
    const res = await request(app).put(`/api/academic-years/${year._id}`).set('Authorization', `Bearer ${token}`).send({ year: '2025' });
    expect(res.status).toBe(200);
  });

  it('PUT /api/academic-years/:id/activate deactivates others and activates this one', async () => {
    await AcademicYear.create({ year: '2024', isActive: true });
    const y2 = await AcademicYear.create({ year: '2026' });
    const res = await request(app).put(`/api/academic-years/${y2._id}/activate`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const activeYears = await AcademicYear.find({ isActive: true });
    expect(activeYears.length).toBe(1);
    expect(activeYears[0]._id.toString()).toBe(y2._id.toString());
  });

  it('DELETE /api/academic-years/:id returns 400 when related data exists without confirm', async () => {
    const year = await AcademicYear.create({ year: '2027' });
    await Class.create({ name: 'S1', level: 'O-Level', academicYearId: year._id });
    const res = await request(app).delete(`/api/academic-years/${year._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('DELETE /api/academic-years/:id succeeds with confirm=true', async () => {
    const year = await AcademicYear.create({ year: '2028' });
    const res = await request(app).delete(`/api/academic-years/${year._id}?confirm=true`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('POST /api/academic-years returns 403 for teacher', async () => {
    const res = await request(app).post('/api/academic-years').set('Authorization', `Bearer ${teacherToken}`).send({ year: '2030' });
    expect(res.status).toBe(403);
  });

  it('GET /api/academic-years returns 401 without token', async () => {
    const res = await request(app).get('/api/academic-years');
    expect(res.status).toBe(401);
  });
});

describe('Terms', () => {
  let year;

  beforeEach(async () => {
    year = await AcademicYear.create({ year: '2024', isActive: true });
  });

  it('POST /api/terms creates a term', async () => {
    const res = await request(app).post('/api/terms').set('Authorization', `Bearer ${token}`).send({ name: 'Term 1', academicYearId: year._id, startDate: '2024-01-01', endDate: '2024-03-31' });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Term 1');
  });

  it('POST /api/terms returns 409 for duplicate name+year', async () => {
    await request(app).post('/api/terms').set('Authorization', `Bearer ${token}`).send({ name: 'Term 1', academicYearId: year._id, startDate: '2024-01-01', endDate: '2024-03-31' });
    const res = await request(app).post('/api/terms').set('Authorization', `Bearer ${token}`).send({ name: 'Term 1', academicYearId: year._id, startDate: '2024-04-01', endDate: '2024-06-30' });
    expect(res.status).toBe(409);
  });

  it('POST /api/terms returns 400 when required fields missing', async () => {
    const res = await request(app).post('/api/terms').set('Authorization', `Bearer ${token}`).send({ name: 'Term 1' });
    expect(res.status).toBe(400);
  });

  it('GET /api/terms lists terms', async () => {
    await Term.create({ name: 'Term 1', academicYearId: year._id, startDate: new Date('2024-01-01'), endDate: new Date('2024-03-31') });
    const res = await request(app).get('/api/terms').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  it('GET /api/terms filters by academicYearId', async () => {
    const y2 = await AcademicYear.create({ year: '2025' });
    await Term.create({ name: 'Term 1', academicYearId: year._id, startDate: new Date('2024-01-01'), endDate: new Date('2024-03-31') });
    await Term.create({ name: 'Term 1', academicYearId: y2._id, startDate: new Date('2025-01-01'), endDate: new Date('2025-03-31') });
    const res = await request(app).get(`/api/terms?academicYearId=${year._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  it('GET /api/terms/:id returns a term', async () => {
    const term = await Term.create({ name: 'Term 1', academicYearId: year._id, startDate: new Date('2024-01-01'), endDate: new Date('2024-03-31') });
    const res = await request(app).get(`/api/terms/${term._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('PUT /api/terms/:id updates a term', async () => {
    const term = await Term.create({ name: 'Term 1', academicYearId: year._id, startDate: new Date('2024-01-01'), endDate: new Date('2024-03-31') });
    const res = await request(app).put(`/api/terms/${term._id}`).set('Authorization', `Bearer ${token}`).send({ name: 'Term 2' });
    expect(res.status).toBe(200);
  });

  it('DELETE /api/terms/:id deletes a term and cascades', async () => {
    const term = await Term.create({ name: 'Term 1', academicYearId: year._id, startDate: new Date('2024-01-01'), endDate: new Date('2024-03-31') });
    const res = await request(app).delete(`/api/terms/${term._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const check = await Term.findById(term._id);
    expect(check).toBeNull();
  });

  it('TERM routes return 403 for student', async () => {
    const res = await request(app).post('/api/terms').set('Authorization', `Bearer ${studentToken}`).send({ name: 'Term 1', academicYearId: year._id, startDate: '2024-01-01', endDate: '2024-03-31' });
    expect(res.status).toBe(403);
  });

  it('GET /api/terms returns 401 without token', async () => {
    const res = await request(app).get('/api/terms');
    expect(res.status).toBe(401);
  });
});

describe('Classes', () => {
  it('POST /api/classes creates a class with auto level', async () => {
    const res = await request(app).post('/api/classes').set('Authorization', `Bearer ${token}`).send({ name: 'S1' });
    expect(res.status).toBe(201);
    expect(res.body.data.level).toBe('O-Level');
  });

  it('POST /api/classes sets A-Level for S5', async () => {
    const res = await request(app).post('/api/classes').set('Authorization', `Bearer ${token}`).send({ name: 'S5' });
    expect(res.status).toBe(201);
    expect(res.body.data.level).toBe('A-Level');
  });

  it('POST /api/classes returns 400 for invalid name', async () => {
    const res = await request(app).post('/api/classes').set('Authorization', `Bearer ${token}`).send({ name: 'S7' });
    expect(res.status).toBe(400);
  });

  it('POST /api/classes returns 409 for duplicate name in same year', async () => {
    await request(app).post('/api/classes').set('Authorization', `Bearer ${token}`).send({ name: 'S2' });
    const res = await request(app).post('/api/classes').set('Authorization', `Bearer ${token}`).send({ name: 'S2' });
    expect(res.status).toBe(409);
  });

  it('GET /api/classes lists classes', async () => {
    const res = await request(app).get('/api/classes').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/classes filters by level', async () => {
    const res = await request(app).get('/api/classes?level=O-Level').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    if (res.body.length > 0) {
      res.body.forEach(c => expect(c.level).toBe('O-Level'));
    }
  });

  it('GET /api/classes/:id returns a class', async () => {
    const cls = await Class.create({ name: 'S3', level: 'O-Level' });
    const res = await request(app).get(`/api/classes/${cls._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('PUT /api/classes/:id updates a class', async () => {
    const cls = await Class.create({ name: 'S4', level: 'O-Level' });
    const res = await request(app).put(`/api/classes/${cls._id}`).set('Authorization', `Bearer ${token}`).send({ name: 'S4' });
    expect(res.status).toBe(200);
  });

  it('DELETE /api/classes/:id deletes and cascades', async () => {
    const cls = await Class.create({ name: 'S6', level: 'A-Level' });
    const res = await request(app).delete(`/api/classes/${cls._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const check = await Class.findById(cls._id);
    expect(check).toBeNull();
  });

  it('GET /api/classes/:id/students returns students in class', async () => {
    const cls = await Class.create({ name: 'S1', level: 'O-Level' });
    const stu = await Student.create({ firstName: 'Test', lastName: 'Student', gender: 'Male', studentCode: 'CLSSTU', classId: cls._id });
    const res = await request(app).get(`/api/classes/${cls._id}/students`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  it('GET /api/classes/:id/performance returns class performance', async () => {
    const cls = await Class.create({ name: 'S1', level: 'O-Level' });
    const term = await Term.create({ name: 'Term 1', academicYearId: new mongoose.Types.ObjectId(), startDate: new Date(), endDate: new Date() });
    const stu = await Student.create({ firstName: 'Perf', lastName: 'Test', gender: 'Female', studentCode: 'PERF01', classId: cls._id });
    await Report.create({ studentId: stu._id, classId: cls._id, termId: term._id, academicYearId: new mongoose.Types.ObjectId(), overallAverage: 80, grade: 'A', remarks: 'Pass', midtermTotal: 80, endTermTotal: 80, classRank: 1, totalStudentsInClass: 1, schoolRank: 1, totalStudentsInSchool: 1 });
    const res = await request(app).get(`/api/classes/${cls._id}/performance?termId=${term._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.classAverage).toBeDefined();
  });

  it('CLASS routes return 403 for student on POST', async () => {
    const res = await request(app).post('/api/classes').set('Authorization', `Bearer ${studentToken}`).send({ name: 'S1' });
    expect(res.status).toBe(403);
  });
});

describe('Sections', () => {
  it('POST /api/sections creates a section', async () => {
    const res = await request(app).post('/api/sections').set('Authorization', `Bearer ${token}`).send({ name: 'Science', level: 'O-Level' });
    expect(res.status).toBe(201);
  });

  it('POST /api/sections returns 409 for duplicate name+level', async () => {
    await request(app).post('/api/sections').set('Authorization', `Bearer ${token}`).send({ name: 'Arts', level: 'A-Level' });
    const res = await request(app).post('/api/sections').set('Authorization', `Bearer ${token}`).send({ name: 'Arts', level: 'A-Level' });
    expect(res.status).toBe(409);
  });

  it('POST /api/sections returns 400 for invalid level', async () => {
    const res = await request(app).post('/api/sections').set('Authorization', `Bearer ${token}`).send({ name: 'Bad', level: 'Invalid' });
    expect(res.status).toBe(400);
  });

  it('GET /api/sections lists sections', async () => {
    const res = await request(app).get('/api/sections').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/sections filters by level', async () => {
    const res = await request(app).get('/api/sections?level=O-Level').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/sections/:id returns a section', async () => {
    const sec = await Section.create({ name: 'Boarding', level: 'O-Level' });
    const res = await request(app).get(`/api/sections/${sec._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('PUT /api/sections/:id updates a section', async () => {
    const sec = await Section.create({ name: 'Day', level: 'O-Level' });
    const res = await request(app).put(`/api/sections/${sec._id}`).set('Authorization', `Bearer ${token}`).send({ name: 'Day Scholar' });
    expect(res.status).toBe(200);
  });

  it('DELETE /api/sections/:id deletes a section', async () => {
    const sec = await Section.create({ name: 'Temp', level: 'O-Level' });
    const res = await request(app).delete(`/api/sections/${sec._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('SECTION routes return 403 for student on POST', async () => {
    const res = await request(app).post('/api/sections').set('Authorization', `Bearer ${studentToken}`).send({ name: 'Test', level: 'O-Level' });
    expect(res.status).toBe(403);
  });
});
