const asyncHandler = require('express-async-handler');
const Suggestion = require('../models/Suggestion');

const getSuggestions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const total = await Suggestion.countDocuments({});
  const suggestions = await Suggestion.find({})
    .populate('authorId', 'name email role')
    .populate('comments.userId', 'name')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();
  return res.json({
    success: true,
    data: suggestions,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

const createSuggestion = asyncHandler(async (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) {
    return res.status(400).json({
      success: false,
      message: 'Please provide title and body',
    });
  }
  const suggestion = await Suggestion.create({
    authorId: req.user._id,
    authorRole: req.user.role,
    title,
    body,
  });
  return res.status(201).json({
    success: true,
    message: 'Suggestion created successfully',
    data: suggestion,
  });
});

const getSuggestionById = asyncHandler(async (req, res) => {
  const suggestion = await Suggestion.findById(req.params.id)
    .populate('authorId', 'name email role')
    .populate('comments.userId', 'name');
  if (!suggestion) {
    return res.status(404).json({
      success: false,
      message: 'Suggestion not found',
    });
  }
  return res.json({ success: true, data: suggestion });
});

const updateSuggestion = asyncHandler(async (req, res) => {
  const suggestion = await Suggestion.findById(req.params.id);
  if (!suggestion) {
    return res.status(404).json({
      success: false,
      message: 'Suggestion not found',
    });
  }
  if (suggestion.authorId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission for this action',
    });
  }
  if (req.body.title) suggestion.title = req.body.title;
  if (req.body.body) suggestion.body = req.body.body;
  const updated = await suggestion.save();
  return res.json({
    success: true,
    message: 'Suggestion updated successfully',
    data: updated,
  });
});

const deleteSuggestion = asyncHandler(async (req, res) => {
  const suggestion = await Suggestion.findById(req.params.id);
  if (!suggestion) {
    return res.status(404).json({
      success: false,
      message: 'Suggestion not found',
    });
  }
  if (suggestion.authorId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to delete this suggestion',
    });
  }
  await Suggestion.deleteOne({ _id: suggestion._id });
  return res.json({
    success: true,
    message: 'Suggestion deleted successfully',
  });
});

const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({
      success: false,
      message: 'Please provide comment text',
    });
  }
  const suggestion = await Suggestion.findById(req.params.id);
  if (!suggestion) {
    return res.status(404).json({
      success: false,
      message: 'Suggestion not found',
    });
  }
  suggestion.comments.push({
    userId: req.user._id,
    userName: req.user.name,
    text,
  });
  await suggestion.save();
  return res.json({
    success: true,
    message: 'Comment added successfully',
    data: suggestion,
  });
});

const updateComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({
      success: false,
      message: 'Please provide comment text',
    });
  }
  const suggestion = await Suggestion.findById(req.params.id);
  if (!suggestion) {
    return res.status(404).json({
      success: false,
      message: 'Suggestion not found',
    });
  }
  const comment = suggestion.comments.id(req.params.commentId);
  if (!comment) {
    return res.status(404).json({
      success: false,
      message: 'Comment not found',
    });
  }
  if (comment.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to edit this comment',
    });
  }
  comment.text = text;
  await suggestion.save();
  return res.json({
    success: true,
    message: 'Comment updated successfully',
    data: suggestion,
  });
});

const deleteComment = asyncHandler(async (req, res) => {
  const suggestion = await Suggestion.findById(req.params.id);
  if (!suggestion) {
    return res.status(404).json({
      success: false,
      message: 'Suggestion not found',
    });
  }
  const comment = suggestion.comments.id(req.params.commentId);
  if (!comment) {
    return res.status(404).json({
      success: false,
      message: 'Comment not found',
    });
  }
  if (comment.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to delete this comment',
    });
  }
  comment.deleteOne();
  await suggestion.save();
  return res.json({
    success: true,
    message: 'Comment deleted successfully',
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  const suggestion = await Suggestion.findById(req.params.id);
  if (!suggestion) {
    return res.status(404).json({
      success: false,
      message: 'Suggestion not found',
    });
  }
  if (!suggestion.readBy.includes(req.user._id)) {
    suggestion.readBy.push(req.user._id);
    await suggestion.save();
  }
  return res.json({
    success: true,
    message: 'Marked as read',
  });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Suggestion.countDocuments({
    readBy: { $ne: req.user._id },
  });
  return res.json({
    success: true,
    data: { count },
  });
});

const likeSuggestion = asyncHandler(async (req, res) => {
  const suggestion = await Suggestion.findById(req.params.id);
  if (!suggestion) {
    return res.status(404).json({
      success: false,
      message: 'Suggestion not found',
    });
  }
  const index = suggestion.likes.indexOf(req.user._id);
  if (index > -1) {
    suggestion.likes.splice(index, 1);
  } else {
    suggestion.likes.push(req.user._id);
  }
  await suggestion.save();
  return res.json({
    success: true,
    message: 'Suggestion like toggled',
    data: suggestion,
  });
});

module.exports = {
  getSuggestions,
  createSuggestion,
  getSuggestionById,
  updateSuggestion,
  deleteSuggestion,
  addComment,
  updateComment,
  deleteComment,
  markAsRead,
  getUnreadCount,
  likeSuggestion,
};
