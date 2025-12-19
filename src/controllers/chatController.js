const Chat = require('../models/Chat');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get all chats
// @route   GET /api/v1/chats
// @access  Private
exports.getChats = asyncHandler(async (req, res, next) => {
  const chats = await Chat.find().populate('lastMessage');

  res.status(200).json({
    success: true,
    data: chats,
  });
});

// @desc    Get single chat
// @route   GET /api/v1/chats/:id
// @access  Private
exports.getChat = asyncHandler(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id).populate('lastMessage');

  if (!chat) {
    return next(
      new ErrorResponse(`Chat not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: chat,
  });
});

// @desc    Create new chat
// @route   POST /api/v1/chats
// @access  Private
exports.createChat = asyncHandler(async (req, res, next) => {
  const chat = await Chat.create(req.body);

  res.status(201).json({
    success: true,
    data: chat,
  });
});

// @desc    Delete chat
// @route   DELETE /api/v1/chats/:id
// @access  Private
exports.deleteChat = asyncHandler(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return next(
      new ErrorResponse(`Chat not found with id of ${req.params.id}`, 404)
    );
  }

  await chat.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});
