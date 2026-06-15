const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createTestApp, TEST_SECRET } = require('./helpers');
const User = require('../models/User');

let app;
let superToken, schoolToken, teacherToken, studentToken;
let superUser, schoolUser, teacherUser, studentUser;
let createdUser;

beforeAll(async () => {
  process.env.JWT_SECRET = TEST_SECRET;
  app = createTestApp();
  app.use('/api/auth', require('../routes/authRoutes'));
  app.use('/api/users', require('../routes/userRoutes'));

  superUser = await User.create({ name: 'Super', email: 'super@test.com', password: 'pass123', role: 'superadmin' });
  schoolUser = await User.create({ name: 'School', email: 'school@test.com', password: 'pass123', role: 'schooladmin' });
  teacherUser = await User.create({ name: 'Teacher', email: 'teacher@test.com', password: 'pass123', role: 'teacher' });
  studentUser = await User.create({ name: 'Student', email: 'student@test.com', password: 'pass123', role: 'student' });
  superToken = jwt.sign({ id: superUser._id }, TEST_SECRET, { expiresIn: '1h' });
  schoolToken = jwt.sign({ id: schoolUser._id }, TEST_SECRET, { expiresIn: '1h' });
  teacherToken = jwt.sign({ id: teacherUser._id }, TEST_SECRET, { expiresIn: '1h' });
  studentToken = jwt.sign({ id: studentUser._id }, TEST_SECRET, { expiresIn: '1h' });
});

function auth(method, url) {
  const r = request(app)[method](url);
  return { set: (token) => r.set('Authorization', `Bearer ${token}`) };
}

describe('Auth - Login', () => {
  it('POST /api/auth/login succeeds with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'super@test.com', password: 'pass123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.role).toBe('superadmin');
  });

  it('POST /api/auth/login returns 400 when fields missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'super@test.com' });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/login returns 401 for wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'super@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/login returns 401 for non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@test.com', password: 'pass123' });
    expect(res.status).toBe(401);
  });
});

describe('Auth - Logout', () => {
  it('POST /api/auth/logout returns 200', async () => {
    const res = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
  });

  it('POST /api/auth/logout returns 401 without token', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });
});

describe('Auth - Change Password', () => {
  it('PUT /api/auth/change-password succeeds', async () => {
    const res = await request(app).put('/api/auth/change-password').set('Authorization', `Bearer ${superToken}`).send({ currentPassword: 'pass123', newPassword: 'newpass123' });
    expect(res.status).toBe(200);
    const loginRes = await request(app).post('/api/auth/login').send({ email: 'super@test.com', password: 'newpass123' });
    expect(loginRes.status).toBe(200);
    await User.findByIdAndUpdate(superUser._id, { password: 'pass123' });
    superUser.password = 'pass123';
    await superUser.save();
  });

  it('PUT /api/auth/change-password returns 400 for wrong current password', async () => {
    const res = await request(app).put('/api/auth/change-password').set('Authorization', `Bearer ${superToken}`).send({ currentPassword: 'wrong', newPassword: 'newpass123' });
    expect(res.status).toBe(400);
  });

  it('PUT /api/auth/change-password returns 400 when fields missing', async () => {
    const res = await request(app).put('/api/auth/change-password').set('Authorization', `Bearer ${superToken}`).send({});
    expect(res.status).toBe(400);
  });

  it('PUT /api/auth/change-password returns 401 without token', async () => {
    const res = await request(app).put('/api/auth/change-password').send({ currentPassword: 'pass123', newPassword: 'newpass123' });
    expect(res.status).toBe(401);
  });
});

describe('Auth - Reset Password', () => {
  it('POST /api/auth/reset-password succeeds for superadmin', async () => {
    const res = await request(app).post('/api/auth/reset-password').set('Authorization', `Bearer ${superToken}`).send({ userId: teacherUser._id, newPassword: 'reset123' });
    expect(res.status).toBe(200);
  });

  it('POST /api/auth/reset-password returns 403 for teacher', async () => {
    const res = await request(app).post('/api/auth/reset-password').set('Authorization', `Bearer ${teacherToken}`).send({ userId: studentUser._id, newPassword: 'reset123' });
    expect(res.status).toBe(403);
  });

  it('POST /api/auth/reset-password returns 400 when fields missing', async () => {
    const res = await request(app).post('/api/auth/reset-password').set('Authorization', `Bearer ${superToken}`).send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/reset-password returns 404 for non-existent user', async () => {
    const res = await request(app).post('/api/auth/reset-password').set('Authorization', `Bearer ${superToken}`).send({ userId: new mongoose.Types.ObjectId(), newPassword: 'reset123' });
    expect(res.status).toBe(404);
  });
});

describe('Auth - Update Profile', () => {
  it('PUT /api/auth/profile succeeds', async () => {
    const res = await request(app).put('/api/auth/profile').set('Authorization', `Bearer ${superToken}`).send({ name: 'Updated Super' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Super');
    await User.findByIdAndUpdate(superUser._id, { name: 'Super' });
  });

  it('PUT /api/auth/profile returns 409 for duplicate email', async () => {
    const res = await request(app).put('/api/auth/profile').set('Authorization', `Bearer ${superToken}`).send({ email: 'school@test.com' });
    expect(res.status).toBe(409);
  });

  it('PUT /api/auth/profile returns 401 without token', async () => {
    const res = await request(app).put('/api/auth/profile').send({ name: 'Nobody' });
    expect(res.status).toBe(401);
  });
});

describe('User CRUD', () => {
  it('GET /api/users returns paginated list', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  it('GET /api/users returns 403 for teacher', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${teacherToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/users returns 401 without token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('POST /api/users creates a user', async () => {
    const res = await request(app).post('/api/users').set('Authorization', `Bearer ${superToken}`).send({ name: 'New User', email: 'new@test.com', password: 'pass123', role: 'teacher' });
    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('new@test.com');
    createdUser = res.body.data;
  });

  it('POST /api/users returns 409 for duplicate email', async () => {
    const res = await request(app).post('/api/users').set('Authorization', `Bearer ${superToken}`).send({ name: 'Dup', email: 'new@test.com', password: 'pass123' });
    expect(res.status).toBe(409);
  });

  it('POST /api/users returns 400 when fields missing', async () => {
    const res = await request(app).post('/api/users').set('Authorization', `Bearer ${superToken}`).send({ name: 'Incomplete' });
    expect(res.status).toBe(400);
  });

  it('POST /api/users returns 403 for schooladmin creating superadmin', async () => {
    const res = await request(app).post('/api/users').set('Authorization', `Bearer ${schoolToken}`).send({ name: 'Wannabe', email: 'super2@test.com', password: 'pass123', role: 'superadmin' });
    expect(res.status).toBe(403);
  });

  it('GET /api/users/:id returns user by id', async () => {
    const res = await request(app).get(`/api/users/${createdUser._id}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('new@test.com');
  });

  it('GET /api/users/:id returns 404 for non-existent id', async () => {
    const res = await request(app).get(`/api/users/${new mongoose.Types.ObjectId()}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(404);
  });

  it('PUT /api/users/:id updates user', async () => {
    const res = await request(app).put(`/api/users/${createdUser._id}`).set('Authorization', `Bearer ${superToken}`).send({ name: 'Updated User' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated User');
  });

  it('PUT /api/users/:id returns 404 for non-existent id', async () => {
    const res = await request(app).put(`/api/users/${new mongoose.Types.ObjectId()}`).set('Authorization', `Bearer ${superToken}`).send({ name: 'Nope' });
    expect(res.status).toBe(404);
  });

  it('DELETE /api/users/:id deletes a user', async () => {
    const res = await request(app).delete(`/api/users/${createdUser._id}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(200);
    const check = await User.findById(createdUser._id);
    expect(check).toBeNull();
  });

  it('DELETE /api/users/:id returns 403 when trying to delete superadmin', async () => {
    const res = await request(app).delete(`/api/users/${superUser._id}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(403);
  });

  it('DELETE /api/users/:id returns 404 for non-existent id', async () => {
    const res = await request(app).delete(`/api/users/${new mongoose.Types.ObjectId()}`).set('Authorization', `Bearer ${superToken}`);
    expect(res.status).toBe(404);
  });

  it('DELETE /api/users/:id returns 401 without token', async () => {
    const res = await request(app).delete(`/api/users/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(401);
  });
});

describe('Role-based Auth Middleware', () => {
  it('returns 401 for requests without token on protected routes', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('returns 401 for invalid token', async () => {
    const res = await request(app).get('/api/users').set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });

  it('returns 403 for student accessing admin-only resource', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 403 for teacher accessing admin-only resource', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${teacherToken}`);
    expect(res.status).toBe(403);
  });
});
