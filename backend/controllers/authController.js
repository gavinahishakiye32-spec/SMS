const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password',
    });
  }
  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  }
  return res.status(401).json({
    success: false,
    message: 'Invalid credentials',
  });
});

const logout = asyncHandler(async (req, res) => {
  return res.json({
    success: true,
    message: 'Logout successful',
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide currentPassword and newPassword',
    });
  }
  const user = await User.findById(req.user._id);
  if (user && (await user.matchPassword(currentPassword))) {
    user.password = newPassword;
    await user.save();
    return res.json({
      success: true,
      message: 'Password changed successfully',
    });
  }
  return res.status(400).json({
    success: false,
    message: 'Current password is incorrect',
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { userId, newPassword } = req.body;
  if (!userId || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide userId and newPassword',
    });
  }
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }
  user.password = newPassword;
  await user.save();
  return res.json({
    success: true,
    message: 'Password reset successful',
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }
  if (email && email !== user.email) {
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'Email already in use',
      });
    }
    user.email = email;
  }
  if (name) user.name = name;
  await user.save();
  return res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { _id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

module.exports = { login, logout, changePassword, resetPassword, updateProfile };
