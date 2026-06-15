const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createTestApp, TEST_SECRET } = require('./helpers');
const User = require('../models/User');
const Student = require('../models/Student');
const Class = require('../models/Class');
const AcademicYear = require('../models/AcademicYear');
const Term = require('../models/Term');
const Mark = require('../models/Mark');
const Report = require('../models/Report');

let app;
let token;

beforeAll(async () => {
  process.env.JWT_SECRET = TEST_SECRET;
  app = createTestApp();
  app.use('/api/students', require('../routes/studentRoutes'));
  app.use('/api/academic-years', require('../routes/academicYearRoutes'));

  const user = await User.create({ name: 'Admin', email: 'admin@edge.com', password: 'pass123', role: 'superadmin' });
  token = jwt.sign({ id: user._id }, TEST_SECRET, { expiresIn: '1h' });
});

describe('Edge Cases', () => {
  it('GET /api/students/:id returns 404 for non-existent student', async () => {
    const res = await request(app).get(`/api/students/${new mongoose.Types.ObjectId()}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('GET /api/academic-years/:id returns 404 for non-existent year', async () => {
    const res = await request(app).get(`/api/academic-years/${new mongoose.Types.ObjectId()}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('POST /api/academic-years returns 400 for missing year field', async () => {
    const res = await request(app).post('/api/academic-years').set('Authorization', `Bearer ${token}`).send({});
    expect(res.status).toBe(400);
  });

  it('DELETE /api/academic-years/:id returns 404 for non-existent year', async () => {
    const res = await request(app).delete(`/api/academic-years/${new mongoose.Types.ObjectId()}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('handles special characters in student name', async () => {
    const year = await AcademicYear.create({ year: '2024', isActive: true });
    const cls = await Class.create({ name: 'S1', level: 'O-Level' });
    const res = await request(app).post('/api/students').set('Authorization', `Bearer ${token}`).send({
      firstName: "O'Brien", lastName: 'Smith-Johnson', gender: 'Male', classId: cls._id.toString(),
    });
    expect(res.status).toBe(201);
    expect(res.body.data.firstName).toBe("O'Brien");
  });

  it('returns 401 for expired or malformed token', async () => {
    const res = await request(app).get('/api/students').set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.totally.malformed');
    expect(res.status).toBe(401);
  });

  it('returns 401 when no token provided', async () => {
    const res = await request(app).get('/api/students');
    expect(res.status).toBe(401);
  });
});
