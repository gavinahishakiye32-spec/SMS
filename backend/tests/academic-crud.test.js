const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createTestApp, TEST_SECRET } = require('./helpers');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Section = require('../models/Section');
const Term = require('../models/Term');
const AcademicYear = require('../models/AcademicYear');
const Mark = require('../models/Mark');
const Report = require('../models/Report');
const Suggestion = require('../models/Suggestion');
const SchoolSetting = require('../models/SchoolSetting');

let app;
let superToken, teacherToken, studentToken, schoolToken;
let superUser, teacherUser;

beforeAll(async () => {
  process.env.JWT_SECRET = TEST_SECRET;
  app = createTestApp();
  app.use('/api/subjects', require('../routes/subjectRoutes'));
  app.use('/api/marks', require('../routes/markRoutes'));
  app.use('/api/reports', require('../routes/reportRoutes'));
  app.use('/api/analytics', require('../routes/analyticsRoutes'));
  app.use('/api/suggestions', require('../routes/suggestionRoutes'));
  app.use('/api/settings', require('../routes/settingRoutes'));

  superUser = await User.create({ name: 'Super', email: 'super@acad.com', password: 'pass123', role: 'superadmin' });
  teacherUser = await User.create({ name: 'T', email: 't@acad.com', password: 'pass123', role: 'teacher' });
  await User.create({ name: 'School', email: 'sch@acad.com', password: 'pass123', role: 'schooladmin' });
  const studentUser = await User.create({ name: 'S', email: 's@acad.com', password: 'pass123', role: 'student' });
  superToken = jwt.sign({ id: superUser._id }, TEST_SECRET, { expiresIn: '1h' });
  teacherToken = jwt.sign({ id: teacherUser._id }, TEST_SECRET, { expiresIn: '1h' });
  studentToken = jwt.sign({ id: studentUser._id }, TEST_SECRET, { expiresIn: '1h' });
  const school = await User.findOne({ email: 'sch@acad.com' });
  schoolToken = jwt.sign({ id: school._id }, TEST_SECRET, { expiresIn: '1h' });
});

describe('Subject CRUD', () => {
  it('POST /api/subjects creates a subject', async () => {
    const res = await request(app).post('/api/subjects').set('Authorization', `Bearer ${superToken}`).send({ name: 'Mathematics', level: 'O-Level' });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Mathematics');
  });

  it('POST /api/subjects returns 409 for duplicate name+level', async () => {
    await Subject.create({ name: 'Mathematics', level: 'O-Level' });
    const res = await request(app).post('/api/subjects').set('Authorization', `Bearer ${superToken}`).send({ name: 'Mathematics', level: 'O-Level' });
    expect(res.status).toBe(409);
  });

  it('POST /api/subjects returns 400 for missing fields', async () => {
    const res = await request(app).post('/api/subjects').set('Authorization', `Bearer ${superToken}`).send({ name: 'OnlyName' });
    expect(res.status).toBe(400);
  });

  it('POST /api/subjects with classIds', async () => {
    const cls = await Class.create({ name: 'S1', level: 'O-Level' });
    const res = await request(app).post('/api/subjects').set('Authorization', `Bearer ${superToken}`).send({ name: 'English', level: 'O-Level', classIds: [cls._id.toString()] });
    expect(res.status).toBe(201);
  });

  it('GET /api/subjects lists subjects', async () => {
    const res = await request(app).get('/api/subjects').set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/subjects filters by level', async () => {
    const res = await request(app).get('/api/subjects?level=O-Level').set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/subjects searches by name', async () => {
    const res = await request(app).get('/api/subjects?search=Math').set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/subjects/:id returns a subject', async () => {
    const sub = await Subject.create({ name: 'Biology', level: 'O-Level' });
    const res = await request(app).get(`/api/subjects/${sub._id}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
  });

  it('PUT /api/subjects/:id updates a subject', async () => {
    const sub = await Subject.create({ name: 'Chemistry', level: 'O-Level' });
    const res = await request(app).put(`/api/subjects/${sub._id}`).set('Authorization', `Bearer ${superToken}`).send({ name: 'Advanced Chemistry', level: 'A-Level' });
    expect(res.status).toBe(200);
  });

  it('POST /api/subjects/:id/assign-teacher assigns a teacher', async () => {
    const sub = await Subject.create({ name: 'Physics', level: 'O-Level' });
    const teacher = await Teacher.create({ firstName: 'Tchr', lastName: 'One', email: 'tchr1@test.com' });
    const cls = await Class.create({ name: 'S1', level: 'O-Level' });
    const res = await request(app).post(`/api/subjects/${sub._id}/assign-teacher`).set('Authorization', `Bearer ${superToken}`).send({ teacherId: teacher._id, classIds: [cls._id.toString()] });
    expect(res.status).toBe(200);
  });

  it('DELETE /api/subjects/:id deletes and cascades', async () => {
    const sub = await Subject.create({ name: 'Temporary', level: 'O-Level' });
    const res = await request(app).delete(`/api/subjects/${sub._id}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    const check = await Subject.findById(sub._id);
    expect(check).toBeNull();
  });

  it('SUBJECT routes return 403 for student on POST', async () => {
    const res = await request(app).post('/api/subjects').set('Authorization', `Bearer ${studentToken}`).send({ name: 'Blocked', level: 'O-Level' });
    expect(res.status).toBe(403);
  });
});

describe('Mark CRUD', () => {
  let cls, student, subject, term, year, teacherRecord;

  beforeEach(async () => {
    cls = await Class.create({ name: 'S1', level: 'O-Level' });
    subject = await Subject.create({ name: 'Math', level: 'O-Level' });
    year = await AcademicYear.create({ year: '2024' });
    term = await Term.create({ name: 'Term 1', academicYearId: year._id, startDate: new Date('2024-01-01'), endDate: new Date('2024-03-31') });
    student = await Student.create({ firstName: 'Mark', lastName: 'Test', gender: 'Male', studentCode: 'MARK01', classId: cls._id });
    teacherRecord = await Teacher.create({ firstName: 'Mr', lastName: 'Mark', email: 'mr@mark.com' });
  });

  it('POST /api/marks creates a mark (admin flow with teacherId)', async () => {
    const res = await request(app).post('/api/marks').set('Authorization', `Bearer ${superToken}`).send({
      studentId: student._id, subjectId: subject._id, classId: cls._id,
      termId: term._id, academicYearId: year._id, teacherId: teacherRecord._id,
      midtermMarks: 80, endTermMarks: 90,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.subjectAverage).toBeGreaterThan(0);
  }, 10000);

  it('POST /api/marks returns 400 when marks out of range', async () => {
    const res = await request(app).post('/api/marks').set('Authorization', `Bearer ${superToken}`).send({
      studentId: student._id, subjectId: subject._id, classId: cls._id,
      termId: term._id, academicYearId: year._id, teacherId: teacherRecord._id,
      midtermMarks: -1, endTermMarks: 101,
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/marks returns 400 when no marks provided', async () => {
    const res = await request(app).post('/api/marks').set('Authorization', `Bearer ${superToken}`).send({
      studentId: student._id, subjectId: subject._id, classId: cls._id,
      termId: term._id, academicYearId: year._id, teacherId: teacherRecord._id,
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/marks returns 409 for duplicate (student+subject+term+year)', async () => {
    await request(app).post('/api/marks').set('Authorization', `Bearer ${superToken}`).send({
      studentId: student._id, subjectId: subject._id, classId: cls._id,
      termId: term._id, academicYearId: year._id, teacherId: teacherRecord._id,
      midtermMarks: 80, endTermMarks: 90,
    });
    const res = await request(app).post('/api/marks').set('Authorization', `Bearer ${superToken}`).send({
      studentId: student._id, subjectId: subject._id, classId: cls._id,
      termId: term._id, academicYearId: year._id, teacherId: teacherRecord._id,
      midtermMarks: 85, endTermMarks: 95,
    });
    expect(res.status).toBe(409);
  }, 10000);

  it('GET /api/marks lists marks with filters', async () => {
    await Mark.create({ studentId: student._id, subjectId: subject._id, classId: cls._id, termId: term._id, academicYearId: year._id, teacherId: teacherRecord._id, midtermMarks: 80, endTermMarks: 90 });
    const res = await request(app).get(`/api/marks?classId=${cls._id}&limit=100`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/marks filters by multiple params', async () => {
    await Mark.create({ studentId: student._id, subjectId: subject._id, classId: cls._id, termId: term._id, academicYearId: year._id, teacherId: teacherRecord._id, midtermMarks: 80, endTermMarks: 90 });
    const res = await request(app).get(`/api/marks?classId=${cls._id}&subjectId=${subject._id}&termId=${term._id}&academicYearId=${year._id}&limit=100`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].midtermMarks).toBe(80);
  });

  it('GET /api/marks/:id returns a mark', async () => {
    const mark = await Mark.create({ studentId: student._id, subjectId: subject._id, classId: cls._id, termId: term._id, academicYearId: year._id, teacherId: teacherRecord._id, midtermMarks: 80, endTermMarks: 90 });
    const res = await request(app).get(`/api/marks/${mark._id}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
  });

  it('PUT /api/marks/:id updates marks and recalculates grade', async () => {
    const mark = await Mark.create({ studentId: student._id, subjectId: subject._id, classId: cls._id, termId: term._id, academicYearId: year._id, teacherId: teacherRecord._id, midtermMarks: 80, endTermMarks: 90 });
    const res = await request(app).put(`/api/marks/${mark._id}`).set('Authorization', `Bearer ${superToken}`).send({ midtermMarks: 100, endTermMarks: 100 });
    expect(res.status).toBe(200);
    expect(parseFloat(res.body.data.subjectAverage)).toBe(100);
  }, 10000);

  it('PUT /api/marks/:id returns 400 for out of range', async () => {
    const mark = await Mark.create({ studentId: student._id, subjectId: subject._id, classId: cls._id, termId: term._id, academicYearId: year._id, teacherId: teacherRecord._id, midtermMarks: 80, endTermMarks: 90 });
    const res = await request(app).put(`/api/marks/${mark._id}`).set('Authorization', `Bearer ${superToken}`).send({ endTermMarks: 200 });
    expect(res.status).toBe(400);
  });

  it('DELETE /api/marks/:id deletes a mark', async () => {
    const mark = await Mark.create({ studentId: student._id, subjectId: subject._id, classId: cls._id, termId: term._id, academicYearId: year._id, teacherId: teacherRecord._id, midtermMarks: 80, endTermMarks: 90 });
    const res = await request(app).delete(`/api/marks/${mark._id}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/marks/student/:studentId returns student marks', async () => {
    await Mark.create({ studentId: student._id, subjectId: subject._id, classId: cls._id, termId: term._id, academicYearId: year._id, teacherId: teacherRecord._id, midtermMarks: 80, endTermMarks: 90 });
    const res = await request(app).get(`/api/marks/student/${student._id}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/marks/class/:classId returns class marks', async () => {
    await Mark.create({ studentId: student._id, subjectId: subject._id, classId: cls._id, termId: term._id, academicYearId: year._id, teacherId: teacherRecord._id, midtermMarks: 80, endTermMarks: 90 });
    const res = await request(app).get(`/api/marks/class/${cls._id}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/marks/student/:studentId/subject/:subjectId returns marks for subject', async () => {
    await Mark.create({ studentId: student._id, subjectId: subject._id, classId: cls._id, termId: term._id, academicYearId: year._id, teacherId: teacherRecord._id, midtermMarks: 80, endTermMarks: 90 });
    const res = await request(app).get(`/api/marks/student/${student._id}/subject/${subject._id}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
  });
});

describe('Report CRUD', () => {
  let cls, student, term, year, student2, reportId;

  beforeEach(async () => {
    cls = await Class.create({ name: 'S1', level: 'O-Level' });
    year = await AcademicYear.create({ year: '2024' });
    term = await Term.create({ name: 'Term 1', academicYearId: year._id, startDate: new Date('2024-01-01'), endDate: new Date('2024-03-31') });
    student = await Student.create({ firstName: 'Report', lastName: 'Test', gender: 'Female', studentCode: 'REP01', classId: cls._id });
    student2 = await Student.create({ firstName: 'Report', lastName: 'Two', gender: 'Male', studentCode: 'REP02', classId: cls._id });
    const report = await Report.create({ studentId: student._id, classId: cls._id, termId: term._id, academicYearId: year._id, overallAverage: 85, grade: 'A', remarks: 'Pass', midtermTotal: 80, endTermTotal: 90, classRank: 1, totalStudentsInClass: 1, schoolRank: 1, totalStudentsInSchool: 2 });
    reportId = report._id;
  });

  it('GET /api/reports/student/:studentId returns student report', async () => {
    const res = await request(app).get(`/api/reports/student/${student._id}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.report.overallAverage).toBe(85);
  });

  it('GET /api/reports/student/:studentId filters by termId+academicYearId', async () => {
    const res = await request(app).get(`/api/reports/student/${student._id}?termId=${term._id}&academicYearId=${year._id}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.report.grade).toBe('A');
  });

  it('GET /api/reports/student/:studentId/pdf returns PDF', async () => {
    const res = await request(app).get(`/api/reports/student/${student._id}/pdf`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('pdf');
  });

  it('GET /api/reports/class/:classId returns class reports', async () => {
    const res = await request(app).get(`/api/reports/class/${cls._id}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/reports/search searches reports', async () => {
    const res = await request(app).get('/api/reports/search?q=Report').set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/reports/search with multiple filters', async () => {
    const res = await request(app).get(`/api/reports/search?q=Report&classId=${cls._id}&termId=${term._id}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/reports/school returns school report', async () => {
    const res = await request(app).get('/api/reports/school').set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/reports/school filters by level', async () => {
    const res = await request(app).get('/api/reports/school?level=O-Level').set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
  });

  it('PUT /api/reports/:reportId/remark updates remark', async () => {
    const res = await request(app).put(`/api/reports/${reportId}/remark`).set('Authorization', `Bearer ${superToken}`).send({ teacherRemark: 'Excellent work' });
    expect(res.status).toBe(200);
    expect(res.body.data.teacherRemark).toBe('Excellent work');
  });

  it('PUT /api/reports/:reportId/remark returns 404 for non-existent', async () => {
    const res = await request(app).put(`/api/reports/${new mongoose.Types.ObjectId()}/remark`).set('Authorization', `Bearer ${superToken}`).send({ teacherRemark: 'Good' });
    expect(res.status).toBe(404);
  });
});

describe('Analytics', () => {
  it('GET /api/analytics/school returns school analytics', async () => {
    const res = await request(app).get('/api/analytics/school').set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalStudents).toBeDefined();
    expect(res.body.data.totalTeachers).toBeDefined();
    expect(res.body.data.totalClasses).toBeDefined();
  });

  it('GET /api/analytics/school returns 403 for teacher', async () => {
    const res = await request(app).get('/api/analytics/school').set('Authorization', `Bearer ${teacherToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/analytics/top-students returns top students', async () => {
    const res = await request(app).get('/api/analytics/top-students').set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/analytics/bottom-students returns bottom students', async () => {
    const res = await request(app).get('/api/analytics/bottom-students').set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/analytics/class/:classId returns class analytics', async () => {
    const cls = await Class.create({ name: 'S1', level: 'O-Level' });
    const res = await request(app).get(`/api/analytics/class/${cls._id}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
  });

  it('GET /api/analytics/subject/:subjectId returns subject analytics', async () => {
    const sub = await Subject.create({ name: 'Physics', level: 'O-Level' });
    const res = await request(app).get(`/api/analytics/subject/${sub._id}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
  });
});

describe('Suggestions CRUD', () => {
  let suggestionId;

  beforeEach(async () => {
    const sug = await Suggestion.create({ authorId: superUser._id, authorRole: 'superadmin', title: 'Test Suggestion', body: 'This is a test suggestion body' });
    suggestionId = sug._id;
  });

  it('GET /api/suggestions lists suggestions', async () => {
    const res = await request(app).get('/api/suggestions').set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/suggestions/unread-count returns count', async () => {
    const res = await request(app).get('/api/suggestions/unread-count').set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.count).toBeDefined();
  });

  it('POST /api/suggestions creates a suggestion', async () => {
    const res = await request(app).post('/api/suggestions').set('Authorization', `Bearer ${superToken}`).send({ title: 'New Suggestion', body: 'New body' });
    expect(res.status).toBe(201);
  });

  it('POST /api/suggestions returns 400 for missing fields', async () => {
    const res = await request(app).post('/api/suggestions').set('Authorization', `Bearer ${superToken}`).send({ title: 'Incomplete' });
    expect(res.status).toBe(400);
  });

  it('GET /api/suggestions/:id returns a suggestion', async () => {
    const res = await request(app).get(`/api/suggestions/${suggestionId}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Test Suggestion');
  });

  it('PUT /api/suggestions/:id updates own suggestion', async () => {
    const res = await request(app).put(`/api/suggestions/${suggestionId}`).set('Authorization', `Bearer ${superToken}`).send({ title: 'Updated' });
    expect(res.status).toBe(200);
  });

  it('POST /api/suggestions/:id/like toggles like', async () => {
    const res = await request(app).post(`/api/suggestions/${suggestionId}/like`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    const res2 = await request(app).post(`/api/suggestions/${suggestionId}/like`).set('Authorization', `Bearer ${superToken}`);
    expect(res2.status).toBe(200);
  });

  it('POST /api/suggestions/:id/comment adds a comment', async () => {
    const res = await request(app).post(`/api/suggestions/${suggestionId}/comment`).set('Authorization', `Bearer ${superToken}`).send({ text: 'Great suggestion!' });
    expect(res.status).toBe(200);
    expect(res.body.data.comments.length).toBe(1);
  });

  it('POST /api/suggestions/:id/read marks as read', async () => {
    const res = await request(app).post(`/api/suggestions/${suggestionId}/read`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
  });

  it('DELETE /api/suggestions/:id deletes own suggestion', async () => {
    const res = await request(app).delete(`/api/suggestions/${suggestionId}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
  });

  it('SUGGESTION returns 403 for student', async () => {
    const res = await request(app).post('/api/suggestions').set('Authorization', `Bearer ${studentToken}`).send({ title: 'Nope', body: 'No' });
    expect(res.status).toBe(403);
  });
});

describe('Settings', () => {
  it('GET /api/settings returns settings', async () => {
    const res = await request(app).get('/api/settings').set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.schoolName).toBeDefined();
  });

  it('PUT /api/settings updates settings', async () => {
    const res = await request(app).put('/api/settings').set('Authorization', `Bearer ${superToken}`).field('schoolName', 'Test School');
    expect(res.status).toBe(200);
    expect(res.body.data.schoolName).toBe('Test School');
  });

  it('PUT /api/settings returns 403 for teacher', async () => {
    const res = await request(app).put('/api/settings').set('Authorization', `Bearer ${teacherToken}`).field('schoolName', 'Hacked');
    expect(res.status).toBe(403);
  });
});
