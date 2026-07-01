const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Mark = require('../models/Mark');
const Report = require('../models/Report');

const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = req.user.role === 'schooladmin'
    ? { role: { $nin: ['superadmin', 'schooladmin'] } }
    : {};

  const total = await User.countDocuments(filter);
  const users = await User.find(filter).select('-password').skip(skip).limit(limit);
  return res.json({
    success: true,
    data: users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, email, and password',
    });
  }
  
  if (req.user.role === 'schooladmin' && (role === 'superadmin' || role === 'schooladmin')) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to create this user role',
    });
  }

  if (role === 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Cannot create superadmin. The superadmin account already exists and only one is allowed.',
    });
  }

  if (role && !['superadmin', 'schooladmin', 'teacher', 'student'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role specified',
    });
  }
  
  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(409).json({
      success: false,
      message: 'A user with this email already exists. Please use a different email address.',
    });
  }
  
  try {
    const user = await User.create({ name, email, password, role });
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists. Please use a different email address.',
      });
    }
    throw error;
  }
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }
  if (req.user.role === 'schooladmin' && ['superadmin', 'schooladmin'].includes(user.role)) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to view this user',
    });
  }
  return res.json({ success: true, data: user });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }
  if (user.role === 'superadmin' || (req.user.role === 'schooladmin' && user.role === 'schooladmin')) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to update this user',
    });
  }
  
  // Check if email is being changed and if it already exists
  if (req.body.email && req.body.email !== user.email) {
    const emailExists = await User.findOne({ email: req.body.email });
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists. Please use a different email address.',
      });
    }
  }
  
  const newRole = req.body.role || user.role;

  if (req.body.role && !['superadmin', 'schooladmin', 'teacher', 'student'].includes(req.body.role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role specified',
    });
  }

  if (req.body.role && user.role === 'student' && ['superadmin', 'schooladmin'].includes(req.body.role)) {
    return res.status(403).json({
      success: false,
      message: 'Students cannot be promoted to admin roles',
    });
  }

  if (req.user.role === 'schooladmin' && req.body.role && ['superadmin', 'schooladmin'].includes(req.body.role)) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to assign this role',
    });
  }

  if (req.body.role === 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'No one can be promoted to superadmin. Only one superadmin exists and it cannot be changed.',
    });
  }

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  user.role = newRole;
  if (req.body.password) {
    user.password = req.body.password;
  }
  
  try {
    const updated = await user.save();
    return res.json({
      success: true,
      message: 'User updated successfully',
      data: { _id: updated._id, name: updated.name, email: updated.email, role: updated.role },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists. Please use a different email address.',
      });
    }
    throw error;
  }
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }
  if (user.role === 'superadmin' || (req.user.role === 'schooladmin' && user.role === 'schooladmin')) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to delete this user',
    });
  }
  if (user.role === 'student') {
    const students = await Student.find({ userId: user._id });
    for (const student of students) {
      await Mark.deleteMany({ studentId: student._id });
      await Report.deleteMany({ studentId: student._id });
    }
    await Student.deleteMany({ userId: user._id });
  } else if (user.role === 'teacher') {
    await Teacher.deleteOne({ userId: user._id });
  }
  await User.deleteOne({ _id: user._id });
  return res.json({
    success: true,
    message: 'User deleted successfully',
  });
});

module.exports = { getUsers, createUser, getUserById, updateUser, deleteUser };
