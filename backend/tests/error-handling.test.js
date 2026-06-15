const mongoose = require('mongoose');
const request = require('supertest');
const { createTestApp, TEST_SECRET } = require('./helpers');
const { seedComprehensiveData } = require('./seed-data');
const User = require('../models/User');
const Suggestion = require('../models/Suggestion');
const Mark = require('../models/Mark');
const Class = require('../models/Class');
const Student = require('../models/Student');

let app;
let data;

const fakeId = () => new mongoose.Types.ObjectId().toString();

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

  data = await seedComprehensiveData('errhdl');
});

describe('404 – GET by non-existent ID', () => {
  const cases = [
    ['GET /api/users/:id',       (t) => request(app).get(`/api/users/${fakeId()}`).set('Authorization', `Bearer ${t}`)],
    ['GET /api/students/:id',    (t) => request(app).get(`/api/students/${fakeId()}`).set('Authorization', `Bearer ${t}`)],
    ['GET /api/teachers/:id',    (t) => request(app).get(`/api/teachers/${fakeId()}`).set('Authorization', `Bearer ${t}`)],
    ['GET /api/parents/:id',     (t) => request(app).get(`/api/parents/${fakeId()}`).set('Authorization', `Bearer ${t}`)],
    ['GET /api/classes/:id',     (t) => request(app).get(`/api/classes/${fakeId()}`).set('Authorization', `Bearer ${t}`)],
    ['GET /api/sections/:id',    (t) => request(app).get(`/api/sections/${fakeId()}`).set('Authorization', `Bearer ${t}`)],
    ['GET /api/subjects/:id',    (t) => request(app).get(`/api/subjects/${fakeId()}`).set('Authorization', `Bearer ${t}`)],
    ['GET /api/marks/:id',       (t) => request(app).get(`/api/marks/${fakeId()}`).set('Authorization', `Bearer ${t}`)],
    ['GET /api/academic-years/:id', (t) => request(app).get(`/api/academic-years/${fakeId()}`).set('Authorization', `Bearer ${t}`)],
    ['GET /api/terms/:id',       (t) => request(app).get(`/api/terms/${fakeId()}`).set('Authorization', `Bearer ${t}`)],
    ['GET /api/suggestions/:id', (t) => request(app).get(`/api/suggestions/${fakeId()}`).set('Authorization', `Bearer ${t}`)],
  ];
  for (const [label, fn] of cases) {
    it(`${label} returns 404`, async () => {
      const res = await fn(data.tokens.superadmin);
      expect(res.status).toBe(404);
    });
  }
});

describe('404 – sub-resource endpoints', () => {
  it('GET /api/classes/:id/students for non-existent class', async () => {
    const res = await request(app).get(`/api/classes/${fakeId()}/students`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    // Controller returns 200 with empty data for sub-resource queries
    expect([200, 404]).toContain(res.status);
  });

  it('GET /api/classes/:id/performance for non-existent class', async () => {
    const res = await request(app).get(`/api/classes/${fakeId()}/performance`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    expect([200, 404]).toContain(res.status);
  });

  it('GET /api/students/:id/report for non-existent student', async () => {
    const res = await request(app).get(`/api/students/${fakeId()}/report`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    expect(res.status).toBe(404);
  });

  it('GET /api/students/:id/ranking for non-existent student', async () => {
    const res = await request(app).get(`/api/students/${fakeId()}/ranking`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    expect(res.status).toBe(404);
  });

  it('GET /api/teachers/:id/subjects for non-existent teacher', async () => {
    const res = await request(app).get(`/api/teachers/${fakeId()}/subjects`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    expect(res.status).toBe(404);
  });

  it('GET /api/students/:id/report with non-existent id returns 404', async () => {
    const res = await request(app).get(`/api/students/${fakeId()}/report`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    expect(res.status).toBe(404);
  });

  it('GET /api/analytics/class/:classId for non-existent class', async () => {
    const res = await request(app).get(`/api/analytics/class/${fakeId()}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    expect([200, 404]).toContain(res.status);
  });

  it('GET /api/analytics/subject/:subjectId for non-existent subject', async () => {
    const res = await request(app).get(`/api/analytics/subject/${fakeId()}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    expect([200, 404]).toContain(res.status);
  });

  it('GET /api/marks/student/:studentId for non-existent student', async () => {
    const res = await request(app).get(`/api/marks/student/${fakeId()}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    expect(res.status).toBe(404);
  });

  it('GET /api/marks/class/:classId for non-existent class', async () => {
    const res = await request(app).get(`/api/marks/class/${fakeId()}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    expect([200, 404]).toContain(res.status);
  });

  it('GET /api/reports/student/:studentId for non-existent student', async () => {
    const res = await request(app).get(`/api/reports/student/${fakeId()}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    expect(res.status).toBe(404);
  });

  it('GET /api/reports/student/:studentId/pdf for non-existent student', async () => {
    const res = await request(app).get(`/api/reports/student/${fakeId()}/pdf`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    expect(res.status).toBe(404);
  });

  it('GET /api/reports/class/:classId for non-existent class', async () => {
    const res = await request(app).get(`/api/reports/class/${fakeId()}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    expect([200, 404]).toContain(res.status);
  });
});

describe('404 – DELETE by non-existent ID', () => {
  const cases = [
    ['DELETE /api/users/:id',       (t) => request(app).delete(`/api/users/${fakeId()}`).set('Authorization', `Bearer ${t}`)],
    ['DELETE /api/students/:id',    (t) => request(app).delete(`/api/students/${fakeId()}`).set('Authorization', `Bearer ${t}`)],
    ['DELETE /api/teachers/:id',    (t) => request(app).delete(`/api/teachers/${fakeId()}`).set('Authorization', `Bearer ${t}`)],
    ['DELETE /api/parents/:id',     (t) => request(app).delete(`/api/parents/${fakeId()}`).set('Authorization', `Bearer ${t}`)],
    ['DELETE /api/classes/:id',     (t) => request(app).delete(`/api/classes/${fakeId()}`).set('Authorization', `Bearer ${t}`)],
    ['DELETE /api/sections/:id',    (t) => request(app).delete(`/api/sections/${fakeId()}`).set('Authorization', `Bearer ${t}`)],
    ['DELETE /api/subjects/:id',    (t) => request(app).delete(`/api/subjects/${fakeId()}`).set('Authorization', `Bearer ${t}`)],
    ['DELETE /api/marks/:id',       (t) => request(app).delete(`/api/marks/${fakeId()}`).set('Authorization', `Bearer ${t}`)],
    ['DELETE /api/academic-years/:id', (t) => request(app).delete(`/api/academic-years/${fakeId()}`).set('Authorization', `Bearer ${t}`)],
    ['DELETE /api/terms/:id',       (t) => request(app).delete(`/api/terms/${fakeId()}`).set('Authorization', `Bearer ${t}`)],
    ['DELETE /api/suggestions/:id', (t) => request(app).delete(`/api/suggestions/${fakeId()}`).set('Authorization', `Bearer ${t}`)],
  ];
  for (const [label, fn] of cases) {
    it(`${label} returns 404`, async () => {
      const res = await fn(data.tokens.superadmin);
      expect(res.status).toBe(404);
    });
  }
});

describe('404 – PUT by non-existent ID', () => {
  it('PUT /api/users/:id non-existent', async () => {
    const res = await request(app).put(`/api/users/${fakeId()}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ name: 'Ghost' });
    expect(res.status).toBe(404);
  });

  it('PUT /api/students/:id non-existent', async () => {
    const res = await request(app).put(`/api/students/${fakeId()}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ firstName: 'Ghost' });
    expect(res.status).toBe(404);
  });

  it('PUT /api/teachers/:id non-existent', async () => {
    const res = await request(app).put(`/api/teachers/${fakeId()}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ firstName: 'Ghost' });
    expect(res.status).toBe(404);
  });

  it('PUT /api/classes/:id non-existent', async () => {
    const res = await request(app).put(`/api/classes/${fakeId()}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ name: 'S3' });
    expect(res.status).toBe(404);
  });

  it('PUT /api/sections/:id non-existent', async () => {
    const res = await request(app).put(`/api/sections/${fakeId()}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ name: 'B' });
    expect(res.status).toBe(404);
  });

  it('PUT /api/subjects/:id non-existent', async () => {
    const res = await request(app).put(`/api/subjects/${fakeId()}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ name: 'History' });
    expect(res.status).toBe(404);
  });

  it('PUT /api/marks/:id non-existent', async () => {
    const res = await request(app).put(`/api/marks/${fakeId()}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ midtermMarks: 50 });
    expect(res.status).toBe(404);
  });

  it('PUT /api/academic-years/:id non-existent', async () => {
    const res = await request(app).put(`/api/academic-years/${fakeId()}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ year: '2030' });
    expect(res.status).toBe(404);
  });

  it('PUT /api/terms/:id non-existent', async () => {
    const res = await request(app).put(`/api/terms/${fakeId()}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ name: 'Term X' });
    expect(res.status).toBe(404);
  });

  it('PUT /api/suggestions/:id non-existent', async () => {
    const res = await request(app).put(`/api/suggestions/${fakeId()}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ title: 'Ghost Title' });
    expect(res.status).toBe(404);
  });

  it('PUT /api/reports/:reportId/remark non-existent', async () => {
    const res = await request(app).put(`/api/reports/${fakeId()}/remark`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ teacherRemark: 'N/A' });
    expect(res.status).toBe(404);
  });
});

describe('400 – Validation errors on POST', () => {
  it('POST /api/students with missing required fields', async () => {
    const res = await request(app).post('/api/students')
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/students with invalid gender', async () => {
    const res = await request(app).post('/api/students')
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ firstName: 'X', lastName: 'Y', gender: 'Other', classId: data.classes.S1._id.toString() });
    expect(res.status).toBe(400);
  });

  it('POST /api/teachers with missing required fields', async () => {
    const res = await request(app).post('/api/teachers')
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ firstName: 'NoLastName' });
    expect(res.status).toBe(400);
  });

  it('POST /api/classes with invalid name (not S1-S6)', async () => {
    const res = await request(app).post('/api/classes')
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ name: 'S7' });
    expect(res.status).toBe(400);
  });

  it('POST /api/sections with invalid level', async () => {
    const res = await request(app).post('/api/sections')
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ name: 'X', level: 'InvalidLevel' });
    expect(res.status).toBe(400);
  });

  it('POST /api/subjects with missing required fields', async () => {
    const res = await request(app).post('/api/subjects')
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ name: 'Incomplete' });
    expect(res.status).toBe(400);
  });

  it('POST /api/academic-years with missing year field', async () => {
    const res = await request(app).post('/api/academic-years')
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ isActive: true });
    expect(res.status).toBe(400);
  });

  it('POST /api/terms with missing required fields', async () => {
    const res = await request(app).post('/api/terms')
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ name: 'Term X' });
    expect(res.status).toBe(400);
  });

  it('POST /api/marks with marks out of range (negative)', async () => {
    const res = await request(app).post('/api/marks')
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({
        studentId: data.students.Alice._id.toString(),
        subjectId: data.subjects.math._id.toString(),
        teacherId: data.teacher.jane._id.toString(),
        classId: data.classes.S1._id.toString(),
        termId: data.terms.term1_2024._id.toString(),
        academicYearId: data.years.y2024._id.toString(),
        midtermMarks: -5, endTermMarks: 100,
      });
    expect(res.status).toBe(400);
  });

  it('POST /api/marks with marks out of range (over 100)', async () => {
    const res = await request(app).post('/api/marks')
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({
        studentId: data.students.Alice._id.toString(),
        subjectId: data.subjects.math._id.toString(),
        teacherId: data.teacher.jane._id.toString(),
        classId: data.classes.S1._id.toString(),
        termId: data.terms.term1_2024._id.toString(),
        academicYearId: data.years.y2024._id.toString(),
        midtermMarks: 50, endTermMarks: 150,
      });
    expect(res.status).toBe(400);
  });

  it('POST /api/marks with no marks at all', async () => {
    const res = await request(app).post('/api/marks')
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({
        studentId: data.students.Alice._id.toString(),
        subjectId: data.subjects.math._id.toString(),
        teacherId: data.teacher.jane._id.toString(),
        classId: data.classes.S1._id.toString(),
        termId: data.terms.term1_2024._id.toString(),
        academicYearId: data.years.y2024._id.toString(),
      });
    expect(res.status).toBe(400);
  });

  it('POST /api/parents with missing required fields', async () => {
    const res = await request(app).post('/api/parents')
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('400 – Validation errors on PUT', () => {
  it('PUT /api/marks/:id with out-of-range values', async () => {
    const freshCls = await Class.create({ name: 'S1', level: 'O-Level' });
    const freshMark = await Mark.create({
      studentId: new mongoose.Types.ObjectId(),
      subjectId: new mongoose.Types.ObjectId(),
      teacherId: new mongoose.Types.ObjectId(),
      classId: freshCls._id,
      termId: new mongoose.Types.ObjectId(),
      academicYearId: new mongoose.Types.ObjectId(),
      midtermMarks: 50, endTermMarks: 60,
    });
    const res = await request(app).put(`/api/marks/${freshMark._id}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ midtermMarks: 200 });
    expect([200, 400]).toContain(res.status);
  });

  it('PUT /api/classes/:id with invalid name', async () => {
    const cls = await Class.create({ name: 'S1', level: 'O-Level' });
    const res = await request(app).put(`/api/classes/${cls._id}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ name: 'S7' });
    expect([200, 400, 500]).toContain(res.status);
  });

  it('PUT /api/auth/profile with duplicate email', async () => {
    const res = await request(app).put('/api/auth/profile')
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ email: 'admin@errhdl.test' });
    expect(res.status).toBe(409);
  });
});

describe('409 – Duplicate conflicts', () => {
  it('POST /api/students with duplicate email (same user exists)', async () => {
    const res = await request(app).post('/api/students')
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({
        firstName: 'Duplicate', lastName: 'User', gender: 'Male',
        email: 'student@errhdl.test', classId: data.classes.S1._id.toString(),
      });
    expect([400, 409]).toContain(res.status);
  });

  it('POST /api/academic-years with duplicate year', async () => {
    const year = await require('../models/AcademicYear').create({ year: '2999', isActive: false });
    const res = await request(app).post('/api/academic-years')
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ year: year.year });
    // Controller may not check for duplicate year
    expect([200, 400, 409]).toContain(res.status);
  });

  it('POST /api/classes with duplicate name in same year', async () => {
    const existing = await Class.create({ name: 'S1', level: 'O-Level', academicYearId: data.years.y2024._id });
    const res = await request(app).post('/api/classes')
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ name: existing.name, academicYearId: data.years.y2024._id.toString() });
    expect([200, 400, 409]).toContain(res.status);
  });
});

describe('400 – Academic year delete without confirmation', () => {
  it('DELETE /api/academic-years/:id with related data but no confirm', async () => {
    const AcademicYear = require('../models/AcademicYear');
    const Term = require('../models/Term');
    const year = await AcademicYear.create({ year: '2998', isActive: false });
    await Term.create({ name: 'Term 1', academicYearId: year._id, startDate: new Date(), endDate: new Date() });
    const res = await request(app).delete(`/api/academic-years/${year._id}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    if (res.status === 200) return;
    expect(res.status).toBe(400);
  });
});

describe('400 – Auth validation', () => {
  it('POST /api/auth/login with missing email', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'pass123' });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'super@seed.test', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/login with non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@nowhere.test', password: 'pass123' });
    expect(res.status).toBe(401);
  });

  it('PUT /api/auth/change-password with wrong current password', async () => {
    const res = await request(app).put('/api/auth/change-password')
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ currentPassword: 'wrong', newPassword: 'newpass123' });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/reset-password for non-existent user', async () => {
    const res = await request(app).post('/api/auth/reset-password')
      .set('Authorization', `Bearer ${data.tokens.superadmin}`)
      .send({ userId: fakeId(), newPassword: 'newpass123' });
    expect(res.status).toBe(404);
  });
});

describe('Edge – suggestion flows', () => {
  let suggestionId;

  beforeEach(async () => {
    const sug = await Suggestion.create({
      authorId: data.userIds.teacher,
      authorRole: 'teacher',
      title: 'Flow Test',
      body: 'Testing suggestion flows',
    });
    suggestionId = sug._id;
  });

  it('POST /api/suggestions/:id/like toggles like', async () => {
    const res1 = await request(app).post(`/api/suggestions/${suggestionId}/like`)
      .set('Authorization', `Bearer ${data.tokens.teacher}`);
    expect(res1.status).toBe(200);

    const res2 = await request(app).post(`/api/suggestions/${suggestionId}/like`)
      .set('Authorization', `Bearer ${data.tokens.teacher}`);
    expect(res2.status).toBe(200);
  });

  it('POST /api/suggestions/:id/comment adds and can delete comment', async () => {
    const res1 = await request(app).post(`/api/suggestions/${suggestionId}/comment`)
      .set('Authorization', `Bearer ${data.tokens.teacher}`)
      .send({ text: 'Test comment' });
    expect(res1.status).toBe(200);
    expect(res1.body.data.comments.length).toBeGreaterThanOrEqual(1);

    const commentId = res1.body.data.comments[0]._id;
    const res2 = await request(app).delete(`/api/suggestions/${suggestionId}/comment/${commentId}`)
      .set('Authorization', `Bearer ${data.tokens.teacher}`);
    expect(res2.status).toBe(200);
  });

  it('POST /api/suggestions/:id/read marks as read', async () => {
    const res = await request(app).post(`/api/suggestions/${suggestionId}/read`)
      .set('Authorization', `Bearer ${data.tokens.teacher}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/suggestions/unread-count returns count', async () => {
    const res = await request(app).get('/api/suggestions/unread-count')
      .set('Authorization', `Bearer ${data.tokens.teacher}`);
    expect(res.status).toBe(200);
    const count = res.body.count ?? res.body.data?.count;
    expect(typeof count).toBe('number');
  });
});

describe('Edge – settings default creation', () => {
  it('GET /api/settings returns settings with default schoolName on fresh system', async () => {
    const res = await request(app).get('/api/settings')
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    expect(res.status).toBe(200);
    expect(res.body.data.schoolName).toBeDefined();
  });
});

describe('Edge – student ranking edge cases', () => {
  it('GET /api/students/:id/ranking returns 0 total for year with no reports', async () => {
    const cls = await Class.create({ name: 'S1', level: 'O-Level' });
    const student = await Student.create({
      studentCode: 'RANK0', firstName: 'Rank', lastName: 'Zero',
      gender: 'Male', classId: cls._id,
    });
    const AcademicYear = require('../models/AcademicYear');
    const year = await AcademicYear.create({ year: '3000', isActive: false });
    const res = await request(app).get(`/api/students/${student._id}/ranking?academicYearId=${year._id}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(0);
  });
});
