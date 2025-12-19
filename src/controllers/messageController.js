const Message = require('../models/Message');
const asyncHandler = require('../middlewares/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const config = require('../config');
const Tenant = require('../models/Tenant');
const TenantClientMapping = require('../models/TenantClientMapping');
const Client = require('../models/Client');
const sendResponse = require('../utils/apiResponse');

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

  await Message.updateMany(
    { senderId: senderId, receiverId: receiverId, read: false },
    { $set: { read: true } }
  );

  const messages = await Message.find(query);

  res.status(200).json({
    success: true,
    count: messages.length,
    data: { messages },
  });
});

// @desc    Get all conversations
// @route   GET /api/v1/conversations/:activeProfileId/:activeProfile
// @access  Private
exports.getConversations = asyncHandler(async (req, res, next) => {
  const { activeProfileId, activeProfile } = req.params;

  if (!activeProfileId || !activeProfile) {
    return next(new ErrorResponse('Please provide activeProfileId and activeProfile.', 400));
  }
  let conversations = [];
  if (activeProfile === 'tenant') {
    const tenant = await Tenant.findById(activeProfileId);
    if (tenant) {
      const clientMappings = await TenantClientMapping.find({ tenantId: activeProfileId }).select('clientId');
      const clientIds = clientMappings.map(mapping => mapping.clientId);

      const query = { _id: { $in: clientIds }, isActive: true };

      const clients = await Client.find(query)
        .sort({ createdAt: -1 });

      for (const client of clients) {
        const chatQuery = {
          $or: [
            { senderId: activeProfileId, senderType: activeProfile, receiverId: client._id, receiverType: config.Client },
            { senderId: client._id, senderType: config.Client, receiverId: activeProfileId, receiverType: activeProfile }
          ]
        };

        const lastMessage = await Message.findOne(chatQuery).sort({ createdAt: -1 });
        const unreadCount = await Message.countDocuments({ ...chatQuery, read: false, receiverId: activeProfileId });

        if (lastMessage) {
          conversations.push({
            id: client._id,
            name: client.name,
            profileImageUrl: client.profileImageUrl,
            lastMessage: lastMessage.message,
            lastMessageDate: lastMessage.createdAt,
            unreadCount: unreadCount,
            type: config.Client
          })
        }
      }
    }
  } else if (activeProfile === 'client') {
    const client = await Client.findById(activeProfileId);
    if (client) {
      const tenantMappings = await TenantClientMapping.find({ clientId: activeProfileId }).select('tenantId');
      const tenantIds = tenantMappings.map(mapping => mapping.tenantId);

      const query = { _id: { $in: tenantIds }, isActive: true };

      const tenants = await Tenant.find(query)
        .sort({ createdAt: -1 });

      for (const tenant of tenants) {
        const chatQuery = {
          $or: [
            { senderId: activeProfileId, senderType: activeProfile, receiverId: tenant._id, receiverType: config.Tenant },
            { senderId: tenant._id, senderType: config.Tenant, receiverId: activeProfileId, receiverType: activeProfile }
          ]
        };

        const lastMessage = await Message.findOne(chatQuery).sort({ createdAt: -1 });
        const unreadCount = await Message.countDocuments({ ...chatQuery, read: false, receiverId: activeProfileId });

        if (lastMessage) {
          conversations.push({
            id: tenant._id,
            name: tenant.companyName,
            profileImageUrl: tenant.profileImageUrl,
            lastMessage: lastMessage.message,
            lastMessageDate: lastMessage.createdAt,
            unreadCount: unreadCount,
            type: config.Tenant
          })
        }
      }
    }
  }
  sendResponse(res, 200, 'Clients retrieved successfully', { conversations });
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

// @desc    Mark messages as read
// @route   POST /api/v1/messages/read-messages/:senderId/:receiverId
// @access  Private
exports.readMessages = asyncHandler(async (req, res, next) => {
  const { senderId, receiverId } = req.params;

  if (!senderId || !receiverId) {
    return next(new ErrorResponse('Please provide senderId and receiverId', 400));
  }

  await Message.updateMany(
    { senderId: senderId, receiverId: receiverId, read: false },
    { $set: { read: true } }
  );

  sendResponse(res, 200, 'Messages marked as read successfully', {});
});