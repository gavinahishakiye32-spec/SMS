const asyncHandler = require('express-async-handler');
const Parent = require('../models/Parent');

const getParents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  let query = {};
  if (req.query.search) {
    const escaped = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escaped, 'i');
    query.$or = [{ fullName: searchRegex }, { email: searchRegex }, { phoneNumber: searchRegex }];
  }
  const total = await Parent.countDocuments(query);
  const parents = await Parent.find(query)
    .populate('studentIds', 'firstName lastName studentCode classId')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

  return res.json({
    success: true,
    data: parents,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

const createParent = asyncHandler(async (req, res) => {
  const { fullName, parentType, nationalId, NIN, phoneNumber, email, address, studentIds } = req.body;
  if (!fullName) {
    return res.status(400).json({
      success: false,
      message: 'Please provide fullName',
    });
  }
  const parent = await Parent.create({
    fullName,
    parentType: parentType || undefined,
    nationalId,
    NIN,
    phoneNumber,
    email,
    address,
    studentIds: studentIds || [],
  });
  return res.status(201).json({
    success: true,
    message: 'Parent created successfully',
    data: parent,
  });
});

const getParentById = asyncHandler(async (req, res) => {
  const parent = await Parent.findById(req.params.id)
    .populate('studentIds', 'firstName lastName studentCode classId');
  if (!parent) {
    return res.status(404).json({
      success: false,
      message: 'Parent not found',
    });
  }
  return res.json({ success: true, data: parent });
});

const updateParent = asyncHandler(async (req, res) => {
  const parent = await Parent.findById(req.params.id);
  if (!parent) {
    return res.status(404).json({
      success: false,
      message: 'Parent not found',
    });
  }
  const fields = ['fullName', 'parentType', 'nationalId', 'NIN', 'phoneNumber', 'email', 'address', 'studentIds'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) parent[f] = req.body[f];
  });
  const updated = await parent.save();
  return res.json({
    success: true,
    message: 'Parent updated successfully',
    data: updated,
  });
});

const deleteParent = asyncHandler(async (req, res) => {
  const parent = await Parent.findById(req.params.id);
  if (!parent) {
    return res.status(404).json({
      success: false,
      message: 'Parent not found',
    });
  }
  await Parent.deleteOne({ _id: parent._id });
  return res.json({
    success: true,
    message: 'Parent deleted successfully',
  });
});

module.exports = {
  getParents,
  createParent,
  getParentById,
  updateParent,
  deleteParent,
};
