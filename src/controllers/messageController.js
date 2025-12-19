const Message = require('../models/Message');
const asyncHandler = require('../middlewares/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all messages
// @route   GET /api/v1/messages
// @access  Private
exports.getMessages = asyncHandler(async (req, res, next) => {
  const { senderId, senderType, receiverId, receiverType } = req.params;

  if (!senderId || !senderType || !receiverId || !receiverType) {
    return next(new ErrorResponse('Please provide senderId, senderType, receiverId, and receiverType', 400));
  }

  // Construct a query to get messages between the two parties, in either direction
  const query = {
    $or: [
      { senderId, senderType, receiverId, receiverType },
      { senderId: receiverId, senderType: receiverType, receiverId: senderId, receiverType: senderType }
    ]
  };

  const messages = await Message.find(query);

  res.status(200).json({
    success: true,
    count: messages.length,
    data: { messages },
  });
});

// @desc    Get single message
// @route   GET /api/v1/messages/:id
// @access  Private
exports.getMessage = asyncHandler(async (req, res, next) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    return next(
      new ErrorResponse(`Message not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: message,
  });
});

// @desc    Create new message
// @route   POST /api/v1/messages
// @access  Private
exports.createMessage = asyncHandler(async (req, res, next) => {
  const message = await Message.create(req.body);

  res.status(201).json({
    success: true,
    data: message,
  });
});

// @desc    Update message
// @route   PUT /api/v1/messages/:id
// @access  Private
exports.updateMessage = asyncHandler(async (req, res, next) => {
  let message = await Message.findById(req.params.id);

  if (!message) {
    return next(
      new ErrorResponse(`Message not found with id of ${req.params.id}`, 404)
    );
  }

  message = await Message.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: message,
  });
});

// @desc    Delete message
// @route   DELETE /api/v1/messages/:id
// @access  Private
exports.deleteMessage = asyncHandler(async (req, res, next) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    return next(
      new ErrorResponse(`Message not found with id of ${req.params.id}`, 404)
    );
  }

  await message.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});
