const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createTestApp, TEST_SECRET } = require('./helpers');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const Class = require('../models/Class');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const AcademicYear = require('../models/AcademicYear');
const Term = require('../models/Term');
const Mark = require('../models/Mark');
const Report = require('../models/Report');

let app;
let superToken, teacherToken, studentToken;

beforeAll(async () => {
  process.env.JWT_SECRET = TEST_SECRET;
  app = createTestApp();
  app.use('/api/students', require('../routes/studentRoutes'));
  app.use('/api/teachers', require('../routes/teacherRoutes'));
  app.use('/api/parents', require('../routes/parentRoutes'));

  const superUser = await User.create({ name: 'Super', email: 'super@people.com', password: 'pass123', role: 'superadmin' });
  const teacherUser = await User.create({ name: 'Teacher', email: 't@people.com', password: 'pass123', role: 'teacher' });
  const studentUser = await User.create({ name: 'Student', email: 's@people.com', password: 'pass123', role: 'student' });
  superToken = jwt.sign({ id: superUser._id }, TEST_SECRET, { expiresIn: '1h' });
  teacherToken = jwt.sign({ id: teacherUser._id }, TEST_SECRET, { expiresIn: '1h' });
  studentToken = jwt.sign({ id: studentUser._id }, TEST_SECRET, { expiresIn: '1h' });
});

describe('Student CRUD', () => {
  let cls, sec;

  beforeEach(async () => {
    await AcademicYear.create({ year: '2024', isActive: true });
    cls = await Class.create({ name: 'S1', level: 'O-Level' });
    sec = await Section.create({ name: 'Science', level: 'O-Level' });
  }, 10000);

  it('POST /api/students creates a student with auto-generated code', async () => {
    const res = await request(app).post('/api/students').set('Authorization', `Bearer ${superToken}`).send({ firstName: 'John', lastName: 'Doe', gender: 'Male', classId: cls._id.toString() });
    expect(res.status).toBe(201);
    expect(res.body.data.firstName).toBe('John');
    expect(res.body.data.studentCode).toBeDefined();
    expect(res.body.data.defaultPassword).toBeDefined();
  }, 10000);

  it('POST /api/students returns 400 when required fields missing', async () => {
    const res = await request(app).post('/api/students').set('Authorization', `Bearer ${superToken}`).send({ firstName: 'Jane' });
    expect(res.status).toBe(400);
  });

  it('POST /api/students creates section from sectionName if sectionId not provided', async () => {
    const cls2 = await Class.create({ name: 'S2', level: 'O-Level' });
    const res = await request(app).post('/api/students').set('Authorization', `Bearer ${superToken}`).send({ firstName: 'New', lastName: 'Section', gender: 'Female', classId: cls2._id.toString(), sectionName: 'NewSection', email: 'newsect@test.com' });
    expect(res.status).toBe(201);
    const section = await Section.findOne({ name: 'NewSection' });
    expect(section).not.toBeNull();
  }, 10000);

  it('GET /api/students lists students with pagination', async () => {
    const res = await request(app).get('/api/students').set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  it('GET /api/students filters by classId', async () => {
    const res = await request(app).get(`/api/students?classId=${cls._id}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/students filters by gender', async () => {
    const res = await request(app).get('/api/students?gender=Male').set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    res.body.data.forEach(s => expect(s.gender).toBe('Male'));
  });

  it('GET /api/students filters by level', async () => {
    const res = await request(app).get('/api/students?level=O-Level').set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/students searches by name/code', async () => {
    const stu = await Student.create({ firstName: 'John', lastName: 'Doe', gender: 'Male', studentCode: 'JOHN01', classId: cls._id });
    const res = await request(app).get('/api/students?search=John').set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/students/:id returns a student by id', async () => {
    const stu = await Student.create({ firstName: 'John', lastName: 'Doe', gender: 'Male', studentCode: 'JOHN02', classId: cls._id });
    const res = await request(app).get(`/api/students/${stu._id}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.firstName).toBe('John');
  });

  it('PUT /api/students/:id updates a student', async () => {
    const stu = await Student.create({ firstName: 'John', lastName: 'Doe', gender: 'Male', studentCode: 'JOHN03', classId: cls._id });
    const res = await request(app).put(`/api/students/${stu._id}`).set('Authorization', `Bearer ${superToken}`).send({ firstName: 'Johnny' });
    expect(res.status).toBe(200);
    expect(res.body.data.firstName).toBe('Johnny');
  });

  it('DELETE /api/students/:id deletes a student and cascades', async () => {
    const stu = await Student.create({ firstName: 'John', lastName: 'Doe', gender: 'Male', studentCode: 'JOHN04', classId: cls._id });
    const res = await request(app).delete(`/api/students/${stu._id}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    const check = await Student.findById(stu._id);
    expect(check).toBeNull();
  });

  it('GET /api/students/:id returns 404 for non-existent', async () => {
    const res = await request(app).get(`/api/students/${new mongoose.Types.ObjectId()}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(404);
  });

  it('STUDENT POST returns 403 for student role', async () => {
    const res = await request(app).post('/api/students').set('Authorization', `Bearer ${studentToken}`).send({ firstName: 'X', lastName: 'Y', gender: 'Male', classId: cls._id.toString() });
    expect(res.status).toBe(403);
  });
});

describe('Student Ranking & Report', () => {
  let cls, stu, term, year;

  beforeEach(async () => {
    cls = await Class.create({ name: 'S1', level: 'O-Level' });
    year = await AcademicYear.create({ year: '2024' });
    term = await Term.create({ name: 'Term 1', academicYearId: year._id, startDate: new Date('2024-01-01'), endDate: new Date('2024-03-31') });
    stu = await Student.create({ firstName: 'Rank', lastName: 'Test', gender: 'Male', studentCode: 'RANK01', classId: cls._id });
  });

  it('GET /api/students/:id/ranking returns ranking info', async () => {
    await Report.create({ studentId: stu._id, classId: cls._id, termId: term._id, academicYearId: year._id, overallAverage: 85, grade: 'A', remarks: 'Pass', midtermTotal: 80, endTermTotal: 90, classRank: 1, totalStudentsInClass: 1, schoolRank: 1, totalStudentsInSchool: 1 });
    const res = await request(app).get(`/api/students/${stu._id}/ranking`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.rank).toBeDefined();
    expect(res.body.data.total).toBeDefined();
  });

  it('GET /api/students/:id/ranking filters by termId+academicYearId', async () => {
    await Report.create({ studentId: stu._id, classId: cls._id, termId: term._id, academicYearId: year._id, overallAverage: 85, grade: 'A', remarks: 'Pass', midtermTotal: 80, endTermTotal: 90, classRank: 1, totalStudentsInClass: 1, schoolRank: 1, totalStudentsInSchool: 1 });
    const res = await request(app).get(`/api/students/${stu._id}/ranking?termId=${term._id}&academicYearId=${year._id}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
  });

  it('GET /api/students/:id/report returns student report', async () => {
    await Report.create({ studentId: stu._id, classId: cls._id, termId: term._id, academicYearId: year._id, overallAverage: 85, grade: 'A', remarks: 'Pass', midtermTotal: 80, endTermTotal: 90, classRank: 1, totalStudentsInClass: 1, schoolRank: 1, totalStudentsInSchool: 1 });
    const res = await request(app).get(`/api/students/${stu._id}/report`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.student).toBeDefined();
  });
});

describe('Teacher CRUD', () => {
  it('POST /api/teachers creates a teacher', async () => {
    const res = await request(app).post('/api/teachers').set('Authorization', `Bearer ${superToken}`).field('firstName', 'Jane').field('lastName', 'Smith').field('email', 'jane@teacher.com').field('gender', 'Female');
    expect(res.status).toBe(201);
    expect(res.body.data.firstName).toBe('Jane');
    expect(res.body.data.defaultPassword).toBe('teacher123');
  });

  it('POST /api/teachers returns 400 when required fields missing', async () => {
    const res = await request(app).post('/api/teachers').set('Authorization', `Bearer ${superToken}`).field('firstName', 'Incomplete');
    expect(res.status).toBe(400);
  });

  it('POST /api/teachers returns 409 for duplicate email', async () => {
    await Teacher.create({ firstName: 'Jane', lastName: 'Smith', email: 'jane@teacher.com' });
    const res = await request(app).post('/api/teachers').set('Authorization', `Bearer ${superToken}`).field('firstName', 'Dup').field('lastName', 'Teacher').field('email', 'jane@teacher.com');
    expect(res.status).toBe(409);
  });

  it('GET /api/teachers lists teachers', async () => {
    const res = await request(app).get('/api/teachers').set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/teachers searches by name', async () => {
    await Teacher.create({ firstName: 'Jane', lastName: 'Smith', email: 'jane2@teacher.com' });
    const res = await request(app).get('/api/teachers?search=Jane').set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/teachers/:id returns a teacher', async () => {
    const teacher = await Teacher.create({ firstName: 'Jane', lastName: 'Smith', email: 'jane3@teacher.com' });
    const res = await request(app).get(`/api/teachers/${teacher._id}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.firstName).toBe('Jane');
  });

  it('GET /api/teachers/:id/subjects returns teacher subjects', async () => {
    const teacher = await Teacher.create({ firstName: 'Jane', lastName: 'Smith', email: 'jane4@teacher.com' });
    const res = await request(app).get(`/api/teachers/${teacher._id}/subjects`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
  });

  it('PUT /api/teachers/:id updates a teacher', async () => {
    const teacher = await Teacher.create({ firstName: 'Jane', lastName: 'Smith', email: 'jane5@teacher.com' });
    const res = await request(app).put(`/api/teachers/${teacher._id}`).set('Authorization', `Bearer ${superToken}`).field('firstName', 'Janet');
    expect(res.status).toBe(200);
  });

  it('DELETE /api/teachers/:id deletes a teacher', async () => {
    const teacher = await Teacher.create({ firstName: 'Jane', lastName: 'Smith', email: 'jane6@teacher.com' });
    const res = await request(app).delete(`/api/teachers/${teacher._id}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    const check = await Teacher.findById(teacher._id);
    expect(check).toBeNull();
  });

  it('TEACHER routes return 403 for student on POST', async () => {
    const res = await request(app).post('/api/teachers').set('Authorization', `Bearer ${studentToken}`).field('firstName', 'X').field('lastName', 'Y').field('email', 'x@y.com');
    expect(res.status).toBe(403);
  });
});

describe('Parent CRUD', () => {
  it('POST /api/parents creates a parent', async () => {
    const res = await request(app).post('/api/parents').set('Authorization', `Bearer ${superToken}`).send({ fullName: 'Parent One', phoneNumber: '+256700000001' });
    expect(res.status).toBe(201);
  });

  it('POST /api/parents creates a parent with linked students', async () => {
    const stu = await Student.create({ firstName: 'Child', lastName: 'One', gender: 'Male', studentCode: 'CHILD01' });
    const res = await request(app).post('/api/parents').set('Authorization', `Bearer ${superToken}`).send({ fullName: 'Parent Two', phoneNumber: '+256700000002', studentIds: [stu._id.toString()] });
    expect(res.status).toBe(201);
    expect(res.body.data.studentIds).toBeDefined();
  });

  it('POST /api/parents returns 400 when required fields missing', async () => {
    const res = await request(app).post('/api/parents').set('Authorization', `Bearer ${superToken}`).send({});
    expect(res.status).toBe(400);
  });

  it('GET /api/parents lists parents', async () => {
    const res = await request(app).get('/api/parents').set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/parents searches by name/phone/email', async () => {
    await Parent.create({ fullName: 'Parent One', phoneNumber: '+256700000001' });
    const res = await request(app).get('/api/parents?search=Parent').set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/parents/:id returns a parent', async () => {
    const parent = await Parent.create({ fullName: 'Parent One', phoneNumber: '+256700000001' });
    const res = await request(app).get(`/api/parents/${parent._id}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe('Parent One');
  });

  it('PUT /api/parents/:id updates a parent', async () => {
    const parent = await Parent.create({ fullName: 'Parent One', phoneNumber: '+256700000001' });
    const res = await request(app).put(`/api/parents/${parent._id}`).set('Authorization', `Bearer ${superToken}`).send({ fullName: 'Updated Parent' });
    expect(res.status).toBe(200);
  });

  it('DELETE /api/parents/:id deletes a parent', async () => {
    const parent = await Parent.create({ fullName: 'Parent One', phoneNumber: '+256700000001' });
    const res = await request(app).delete(`/api/parents/${parent._id}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
  });

  it('PARENT routes return 403 for teacher', async () => {
    const res = await request(app).post('/api/parents').set('Authorization', `Bearer ${teacherToken}`).send({ fullName: 'Blocked', phoneNumber: '+256700000099' });
    expect(res.status).toBe(403);
  });
});
