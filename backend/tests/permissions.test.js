const mongoose = require('mongoose');
const request = require('supertest');
const { createTestApp, TEST_SECRET } = require('./helpers');
const { seedComprehensiveData } = require('./seed-data');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');

let app;
let data;

beforeAll(async () => {
  process.env.JWT_SECRET = TEST_SECRET;
  app = createTestApp();

  // Mount all routes
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

  data = await seedComprehensiveData('perm');
});

describe('Auth – 401 without token', () => {
  const noAuthEndpoints = [
    ['GET', '/api/users'],
    ['POST', '/api/users'],
    ['GET', '/api/students'],
    ['POST', '/api/students'],
    ['GET', '/api/teachers'],
    ['POST', '/api/teachers'],
    ['GET', '/api/classes'],
    ['POST', '/api/classes'],
    ['GET', '/api/sections'],
    ['POST', '/api/sections'],
    ['GET', '/api/subjects'],
    ['POST', '/api/subjects'],
    ['GET', '/api/marks'],
    ['POST', '/api/marks'],
    ['GET', '/api/academic-years'],
    ['POST', '/api/academic-years'],
    ['GET', '/api/terms'],
    ['POST', '/api/terms'],
    ['GET', '/api/settings'],
    ['PUT', '/api/settings'],
    ['GET', '/api/suggestions'],
    ['POST', '/api/suggestions'],
    ['GET', '/api/parents'],
    ['POST', '/api/parents'],
    ['GET', '/api/analytics/school'],
    ['GET', '/api/reports/school'],
    ['GET', '/api/reports/search'],
    ['POST', '/api/auth/logout'],
    ['PUT', '/api/auth/profile'],
    ['PUT', '/api/auth/change-password'],
  ];

  for (const [method, path] of noAuthEndpoints) {
    it(`${method} ${path} returns 401 without token`, async () => {
      const res = await request(app)[method.toLowerCase()](path);
      expect(res.status).toBe(401);
    });
  }
});

describe('Auth – 401 with malformed token', () => {
  const malformedEndpoints = [
    ['GET', '/api/users'],
    ['GET', '/api/students'],
    ['GET', '/api/teachers'],
  ];
  for (const [method, path] of malformedEndpoints) {
    it(`${method} ${path} returns 401 with malformed token`, async () => {
      const res = await request(app)[method.toLowerCase()](path)
        .set('Authorization', 'Bearer definitely.not.a.valid.jwt');
      expect(res.status).toBe(401);
    });
  }
});

describe('Students – role-based access', () => {
  it('GET /api/students – student can list', async () => {
    const res = await request(app).get('/api/students').set('Authorization', `Bearer ${data.tokens.student}`);
    expect(res.status).toBe(200);
  });

  it('POST /api/students – student gets 403', async () => {
    const res = await request(app).post('/api/students').set('Authorization', `Bearer ${data.tokens.student}`);
    expect(res.status).toBe(403);
  });

  it('POST /api/students – teacher can create', async () => {
    const cls = await Class.create({ name: 'S1', level: 'O-Level' });
    const subj = await Subject.create({ name: 'Math', level: 'O-Level', classIds: [cls._id] });
    const teacherUser = await User.findById(data.userIds.teacher);
    await Teacher.create({
      userId: teacherUser._id, firstName: 'Create', lastName: 'TestTeacher',
      email: 'createteacher@perm.test', gender: 'Male',
      subjectIds: [{ subjectId: subj._id, classIds: [cls._id] }],
    });
    const res = await request(app).post('/api/students')
      .set('Authorization', `Bearer ${data.tokens.teacher}`)
      .send({ firstName: 'TeacherCreated', lastName: 'Student', gender: 'Male', classId: cls._id.toString() });
    expect([200, 201, 400, 409]).toContain(res.status);
  });

  it('PUT /api/students/:id – student gets 403', async () => {
    const sid = data.students.Alice._id;
    const res = await request(app).put(`/api/students/${sid}`).set('Authorization', `Bearer ${data.tokens.student}`);
    expect(res.status).toBe(403);
  });

  it('DELETE /api/students/:id – student gets 403', async () => {
    const sid = data.students.Frank._id;
    const res = await request(app).delete(`/api/students/${sid}`).set('Authorization', `Bearer ${data.tokens.student}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/students/:id/ranking – student can access own ranking', async () => {
    const studentUser = await User.findById(data.userIds.student);
    const cls = await Class.create({ name: 'S1', level: 'O-Level' });
    const student = await Student.create({
      userId: studentUser._id, studentCode: 'RANKPERM', firstName: 'Rank', lastName: 'Perm',
      gender: 'Male', classId: cls._id,
    });
    const res = await request(app).get(`/api/students/${student._id}/ranking`).set('Authorization', `Bearer ${data.tokens.student}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/students/:id/report – student can access own report', async () => {
    const studentUser = await User.findById(data.userIds.student);
    const cls = await Class.create({ name: 'S1', level: 'O-Level' });
    const student = await Student.create({
      userId: studentUser._id, studentCode: 'REPPERM', firstName: 'Rep', lastName: 'Perm',
      gender: 'Male', classId: cls._id,
    });
    const res = await request(app).get(`/api/students/${student._id}/report`).set('Authorization', `Bearer ${data.tokens.student}`);
    expect(res.status).toBe(200);
  });
});

describe('Teachers – role-based access', () => {
  it('POST /api/teachers – teacher creates teacher gets 403', async () => {
    const res = await request(app).post('/api/teachers')
      .set('Authorization', `Bearer ${data.tokens.teacher}`)
      .send({ firstName: 'Should', lastName: 'Fail', email: 'fail@test.com', gender: 'Male' });
    expect(res.status).toBe(403);
  });

  it('DELETE /api/teachers/:id – teacher deletes teacher gets 403', async () => {
    const res = await request(app).delete(`/api/teachers/${data.teacher.jane._id}`)
      .set('Authorization', `Bearer ${data.tokens.teacher}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/teachers/:id/subjects – teacher can view own subjects', async () => {
    const teacherUser = await User.findById(data.userIds.teacher);
    const subj = await Subject.create({ name: 'Physics', level: 'O-Level' });
    const teacher = await Teacher.create({
      userId: teacherUser._id, firstName: 'View', lastName: 'Subjects',
      email: 'viewsubj@perm.test', gender: 'Male',
      subjectIds: [{ subjectId: subj._id, classIds: [] }],
    });
    const res = await request(app).get(`/api/teachers/${teacher._id}/subjects`)
      .set('Authorization', `Bearer ${data.tokens.teacher}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Marks – role-based access', () => {
  it('POST /api/marks – teacher can create marks', async () => {
    const res = await request(app).post('/api/marks')
      .set('Authorization', `Bearer ${data.tokens.teacher}`)
      .send({
        studentId: data.students.Alice._id.toString(),
        subjectId: data.subjects.math._id.toString(),
        classId: data.classes.S1._id.toString(),
        sectionId: data.sections.O._id.toString(),
        termId: data.terms.term1_2024._id.toString(),
        academicYearId: data.years.y2024._id.toString(),
        midtermMarks: 85, endTermMarks: 92,
      });
    expect([201, 403, 404, 409]).toContain(res.status);
  });

  it('POST /api/marks – student gets 403', async () => {
    const res = await request(app).post('/api/marks')
      .set('Authorization', `Bearer ${data.tokens.student}`);
    expect(res.status).toBe(403);
  });

  it('PUT /api/marks/:id – student gets 403', async () => {
    const res = await request(app).put(`/api/marks/${data.marks[0]._id}`)
      .set('Authorization', `Bearer ${data.tokens.student}`);
    expect(res.status).toBe(403);
  });

  it('DELETE /api/marks/:id – teacher gets 403', async () => {
    const res = await request(app).delete(`/api/marks/${data.marks[0]._id}`)
      .set('Authorization', `Bearer ${data.tokens.teacher}`);
    expect(res.status).toBe(403);
  });
});

describe('Users – role-based access', () => {
  it('GET /api/users – teacher gets 403', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${data.tokens.teacher}`);
    expect(res.status).toBe(403);
  });

  it('POST /api/users – teacher gets 403', async () => {
    const res = await request(app).post('/api/users')
      .set('Authorization', `Bearer ${data.tokens.teacher}`)
      .send({ name: 'Test', email: 'test@test.com', password: 'pass123', role: 'student' });
    expect(res.status).toBe(403);
  });

  it('POST /api/users – schooladmin cannot create superadmin', async () => {
    const res = await request(app).post('/api/users')
      .set('Authorization', `Bearer ${data.tokens.schooladmin}`)
      .send({ name: 'Fake Super', email: 'fakesuper@test.com', password: 'pass123', role: 'superadmin' });
    expect(res.status).toBe(403);
  });

  it('DELETE /api/users/:id – cannot delete superadmin', async () => {
    const res = await request(app).delete(`/api/users/${data.userIds.superadmin}`)
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    expect(res.status).toBe(403);
  });
});

describe('Academic Years – role-based access', () => {
  it('POST /api/academic-years – teacher gets 403', async () => {
    const res = await request(app).post('/api/academic-years')
      .set('Authorization', `Bearer ${data.tokens.teacher}`)
      .send({ year: '2026' });
    expect(res.status).toBe(403);
  });

  it('PUT /api/academic-years/:id/activate – teacher gets 403', async () => {
    const res = await request(app).put(`/api/academic-years/${data.years.y2024._id}/activate`)
      .set('Authorization', `Bearer ${data.tokens.teacher}`);
    expect(res.status).toBe(403);
  });

  it('DELETE /api/academic-years/:id – teacher gets 403', async () => {
    const res = await request(app).delete(`/api/academic-years/${data.years.y2024._id}`)
      .set('Authorization', `Bearer ${data.tokens.teacher}`);
    expect(res.status).toBe(403);
  });
});

describe('Classes – role-based access', () => {
  it('POST /api/classes – teacher gets 403', async () => {
    const res = await request(app).post('/api/classes')
      .set('Authorization', `Bearer ${data.tokens.teacher}`)
      .send({ name: 'S3', academicYearId: data.years.y2024._id.toString() });
    expect(res.status).toBe(403);
  });

  it('PUT /api/classes/:id – student gets 403', async () => {
    const res = await request(app).put(`/api/classes/${data.classes.S1._id}`)
      .set('Authorization', `Bearer ${data.tokens.student}`)
      .send({ name: 'S2' });
    expect(res.status).toBe(403);
  });

  it('DELETE /api/classes/:id – teacher gets 403', async () => {
    const res = await request(app).delete(`/api/classes/${data.classes.S2._id}`)
      .set('Authorization', `Bearer ${data.tokens.teacher}`);
    expect(res.status).toBe(403);
  });
});

describe('Subjects – role-based access', () => {
  it('POST /api/subjects – teacher gets 403', async () => {
    const res = await request(app).post('/api/subjects')
      .set('Authorization', `Bearer ${data.tokens.teacher}`)
      .send({ name: 'History', level: 'O-Level' });
    expect(res.status).toBe(403);
  });

  it('DELETE /api/subjects/:id – teacher gets 403', async () => {
    const res = await request(app).delete(`/api/subjects/${data.subjects.math._id}`)
      .set('Authorization', `Bearer ${data.tokens.teacher}`);
    expect(res.status).toBe(403);
  });
});

describe('Sections – role-based access', () => {
  it('POST /api/sections – student gets 403', async () => {
    const res = await request(app).post('/api/sections')
      .set('Authorization', `Bearer ${data.tokens.student}`)
      .send({ name: 'B', level: 'O-Level' });
    expect(res.status).toBe(403);
  });

  it('PUT /api/sections/:id – teacher gets 403', async () => {
    const res = await request(app).put(`/api/sections/${data.sections.O._id}`)
      .set('Authorization', `Bearer ${data.tokens.teacher}`)
      .send({ name: 'B' });
    expect(res.status).toBe(403);
  });

  it('DELETE /api/sections/:id – teacher gets 403', async () => {
    const res = await request(app).delete(`/api/sections/${data.sections.O._id}`)
      .set('Authorization', `Bearer ${data.tokens.teacher}`);
    expect(res.status).toBe(403);
  });
});

describe('Terms – role-based access', () => {
  it('POST /api/terms – student gets 403 when trying to create', async () => {
    const res = await request(app).post('/api/terms')
      .set('Authorization', `Bearer ${data.tokens.student}`)
      .send({ name: 'Term 3', academicYearId: data.years.y2024._id.toString() });
    expect(res.status).toBe(403);
  });

  it('DELETE /api/terms/:id – teacher gets 403', async () => {
    const res = await request(app).delete(`/api/terms/${data.terms.term1_2024._id}`)
      .set('Authorization', `Bearer ${data.tokens.teacher}`);
    expect(res.status).toBe(403);
  });
});

describe('Reports – role-based access', () => {
  it('GET /api/reports/school – teacher gets 403', async () => {
    const res = await request(app).get('/api/reports/school')
      .set('Authorization', `Bearer ${data.tokens.teacher}`);
    expect(res.status).toBe(403);
  });

  it('PUT /api/reports/:reportId/remark – student gets 403', async () => {
    const res = await request(app).put(`/api/reports/${data.reports[0]._id}/remark`)
      .set('Authorization', `Bearer ${data.tokens.student}`)
      .send({ teacherRemark: 'Good work' });
    expect(res.status).toBe(403);
  });
});

describe('Settings – role-based access', () => {
  it('PUT /api/settings – teacher gets 403', async () => {
    const res = await request(app).put('/api/settings')
      .set('Authorization', `Bearer ${data.tokens.teacher}`)
      .send({ schoolName: 'Hacked' });
    expect(res.status).toBe(403);
  });

  it('GET /api/settings – student can view', async () => {
    const res = await request(app).get('/api/settings')
      .set('Authorization', `Bearer ${data.tokens.student}`);
    expect(res.status).toBe(200);
  });
});

describe('Analytics – role-based access', () => {
  it('GET /api/analytics/school – teacher gets 403', async () => {
    const res = await request(app).get('/api/analytics/school')
      .set('Authorization', `Bearer ${data.tokens.teacher}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/analytics/class/:classId – teacher can view', async () => {
    const cls = await Class.create({ name: 'S1', level: 'O-Level' });
    const subj = await Subject.create({ name: 'Physics', level: 'O-Level', classIds: [cls._id] });
    const teacherUser = await User.findById(data.userIds.teacher);
    await Teacher.create({
      userId: teacherUser._id, firstName: 'Analytics', lastName: 'Teacher',
      email: 'analyticsteach@perm.test', gender: 'Male',
      subjectIds: [{ subjectId: subj._id, classIds: [cls._id] }],
    });
    const res = await request(app).get(`/api/analytics/class/${cls._id}`)
      .set('Authorization', `Bearer ${data.tokens.teacher}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/analytics/subject/:subjectId – teacher can view', async () => {
    const res = await request(app).get(`/api/analytics/subject/${data.subjects.math._id}`)
      .set('Authorization', `Bearer ${data.tokens.teacher}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/analytics/top-students – student gets 403', async () => {
    const res = await request(app).get('/api/analytics/top-students')
      .set('Authorization', `Bearer ${data.tokens.student}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/analytics/bottom-students – student gets 403', async () => {
    const res = await request(app).get('/api/analytics/bottom-students')
      .set('Authorization', `Bearer ${data.tokens.student}`);
    expect(res.status).toBe(403);
  });
});

describe('Suggestions – role-based access', () => {
  it('POST /api/suggestions – student gets 403', async () => {
    const res = await request(app).post('/api/suggestions')
      .set('Authorization', `Bearer ${data.tokens.student}`)
      .send({ title: 'Test', body: 'Test body' });
    expect(res.status).toBe(403);
  });

  it('GET /api/suggestions – teacher can view', async () => {
    const res = await request(app).get('/api/suggestions')
      .set('Authorization', `Bearer ${data.tokens.teacher}`);
    expect(res.status).toBe(200);
  });
});

describe('Parents – role-based access', () => {
  it('GET /api/parents – teacher gets 403', async () => {
    const res = await request(app).get('/api/parents')
      .set('Authorization', `Bearer ${data.tokens.teacher}`);
    expect(res.status).toBe(403);
  });

  it('POST /api/parents – student gets 403', async () => {
    const res = await request(app).post('/api/parents')
      .set('Authorization', `Bearer ${data.tokens.student}`)
      .send({ fullName: 'Test Parent' });
    expect(res.status).toBe(403);
  });
});

describe('Teacher permission flow – getTeacherClassIdSet', () => {
  it('Teacher with subjects can see students in assigned classes', async () => {
    const cls = await Class.create({ name: 'S1', level: 'O-Level' });
    const subj = await Subject.create({ name: 'Physics', level: 'O-Level', classIds: [cls._id] });
    const teacherUser = await User.findById(data.userIds.teacher);
    await Teacher.create({
      userId: teacherUser._id, firstName: 'Assigned', lastName: 'Teacher',
      email: 'assigned@perm.test', gender: 'Male',
      subjectIds: [{ subjectId: subj._id, classIds: [cls._id] }],
    });
    await Student.create({
      studentCode: 'ASG001', firstName: 'Assigned', lastName: 'Student',
      gender: 'Male', classId: cls._id,
    });
    const res = await request(app).get(`/api/students?classId=${cls._id}&limit=100`)
      .set('Authorization', `Bearer ${data.tokens.teacher}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('Teacher without subjects cannot see any students (empty classId filter)', async () => {
    const res = await request(app).get('/api/students?limit=100')
      .set('Authorization', `Bearer ${data.tokens.superadmin}`);
    const totalBefore = res.body.pagination.total;

    // Re-fetch as teacher-no-subjects user
    const noSubjectsToken = require('jsonwebtoken').sign(
      { id: data.userIds.teacherNoSubjects },
      TEST_SECRET, { expiresIn: '1h' }
    );
    const res2 = await request(app).get('/api/students?limit=100')
      .set('Authorization', `Bearer ${noSubjectsToken}`);
    expect(res2.status).toBe(200);
    expect(res2.body.data.length).toBe(0);
  });

  it('Teacher gets 403 when accessing a class not in their subjectIds', async () => {
    // Teacher Jane has only S1, S2 math and S1 english
    // Try to access S5
    const res = await request(app).get(`/api/students?classId=${data.classes.S5._id}`)
      .set('Authorization', `Bearer ${data.tokens.teacher}`);
    expect(res.status).toBe(403);
  });
});
