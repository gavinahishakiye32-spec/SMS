const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const TEST_SECRET = 'test-secret-key';

function createTestUser(overrides = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    name: 'Test User',
    email: 'test@example.com',
    role: 'superadmin',
    ...overrides,
  };
}

function createTestToken(user) {
  const id = user?._id || new mongoose.Types.ObjectId();
  return jwt.sign({ id }, TEST_SECRET, { expiresIn: '1h' });
}

function createTestApp() {
  const app = express();
  app.use(express.json());
  return app;
}

module.exports = { createTestUser, createTestToken, createTestApp, TEST_SECRET };
