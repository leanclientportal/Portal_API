const crypto = require('crypto');
const Client = require('../models/Client');
const Project = require('../models/Project');
const TenantClientMapping = require('../models/TenantClientMapping');
const User = require('../models/User');
const UserTenantClientMapping = require('../models/UserTenantClientMapping');
const asyncHandler = require('../middlewares/asyncHandler');
const { sendInvitationEmail } = require('../utils/emailUtils');
const config = require('../config');
const { string } = require('joi');
const sendResponse = require('../utils/apiResponse');

// @desc    Get all clients for a tenant
// @route   GET /api/v1/clients/:tenantId
// @access  Private
const getClients = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const { page = 1, limit = 20, search, status } = req.query;

  const clientMappings = await TenantClientMapping.find({ tenantId }).select('clientId');
  const clientIds = clientMappings.map(mapping => mapping.clientId);

  const query = { _id: { $in: clientIds }, isActive: true };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (status) query.status = status;

  const clients = await Client.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await Client.countDocuments(query);

  const clientsWithProjects = await Promise.all(
    clients.map(async (client) => {
      const totalProjects = await Project.countDocuments({ clientId: client._id, isDeleted: false });
      return { ...client.toObject(), totalProjects };
    })
  );
  var clientsData = {
    clients: clientsWithProjects
  };
  const pagination = {
    current: parseInt(page),
    total: Math.ceil(total / limit),
    count: clients.length,
    totalRecords: total
  };

  sendResponse(res, 200, 'Clients retrieved successfully', clientsData, pagination);
});

// @desc    Get client list for dropdown
// @route   GET /api/v1/clients/:tenantId/dropdown
// @access  Private
const getClientListForDropdown = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;

  const clientMappings = await TenantClientMapping.find({ tenantId }).select('clientId');
  const clientIds = clientMappings.map(mapping => mapping.clientId);

  const clients = await Client.find({ _id: { $in: clientIds }, isActive: true })
    .select('_id name')
    .sort({ name: 1 });

  const formattedClients = clients.map(client => ({
    value: client._id,
    label: client.name,
  }));

  sendResponse(res, 200, 'Client list for dropdown retrieved successfully', formattedClients);
});

// @desc    Get a single client by client id
// @route   GET /api/v1/clients/:tenantId/:clientId
// @access  Private
const getClientById = asyncHandler(async (req, res) => {
  const { tenantId, clientId } = req.params;

  const mapping = await TenantClientMapping.findOne({ tenantId, clientId });
  if (!mapping) {
    return sendResponse(res, 404, 'Client not found for this tenant', null, false);
  }

  const client = await Client.findOne({ _id: clientId, isActive: true });

  if (!client) {
    return sendResponse(res, 404, 'Client not found', null, false);
  }

  sendResponse(res, 200, 'Client retrieved successfully', client);
});

// @desc    Create new client and mapping
// @route   POST /api/v1/clients/:tenantId
// @access  Private
const createClient = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const { name, email, phone, profileImageUrl } = req.body;

  if (!name || !email) {
    return sendResponse(res, 400, 'Please provide name and email', null, false);
  }

  const invitationToken = crypto.randomBytes(32).toString('hex');

  let client = await Client.findOne({ email });
  if (client) {
    const existingMapping = await TenantClientMapping.findOne({ tenantId, clientId: client._id });
    if (existingMapping) {
      return sendResponse(res, 400, 'A client with this email already exists and is mapped to this tenant', null, false);
    }
    else {
      client = await Client.create({ name, email, phone, profileImageUrl, isActive: true, lastActivityDate: new Date(), invitationToken });
    }
  } else {
    client = await Client.create({ name, email, phone, profileImageUrl, isActive: true, lastActivityDate: new Date(), invitationToken });
  }

  await TenantClientMapping.create({
    tenantId,
    clientId: client._id,
  });

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name,
      email,
      activeProfile: 'client',
      activeProfileId: client._id,
      status: 'pending',
      lastActiveDate: new Date(),
    });

    await UserTenantClientMapping.create({
      userId: user._id,
      masterId: client._id,
      role: 'client',
    });

    await sendInvitationEmail(tenantId, name, email, invitationToken);

  } else {
    await UserTenantClientMapping.create({
      userId: user._id,
      masterId: client._id,
      role: 'client',
    });
  }

  sendResponse(res, 201, 'Client created and invitation sent successfully.', client);
});

// @desc    Update client
// @route   PUT /api/v1/clients/:tenantId/:clientId
// @access  Private
const updateClient = asyncHandler(async (req, res) => {
  const { tenantId, clientId } = req.params;

  const mapping = await TenantClientMapping.findOne({ tenantId, clientId });
  if (!mapping) {
    return sendResponse(res, 404, 'Client not found for this tenant', null, false);
  }

  const updateData = {
    ...req.body,
    lastActivityDate: new Date(),
  };

  const client = await Client.findOneAndUpdate({ _id: clientId }, updateData, { new: true, runValidators: true });

  if (!client) {
    return sendResponse(res, 404, 'Client not found', null, false);
  }

  sendResponse(res, 200, 'Client updated successfully', client);
});

// @desc    Delete client (soft delete)
// @route   DELETE /api/v1/clients/:tenantId/:clientId
// @access  Private
const deleteClient = asyncHandler(async (req, res) => {
  const { tenantId, clientId } = req.params;

  const mapping = await TenantClientMapping.findOne({ tenantId, clientId });
  if (!mapping) {
    return sendResponse(res, 404, 'Client not found for this tenant', null, false);
  }

  const client = await Client.findOneAndUpdate({ _id: clientId }, { isActive: false }, { new: true });

  if (!client) {
    return sendResponse(res, 404, 'Client not found', null, false);
  }

  sendResponse(res, 200, 'Client deleted successfully', {});
});

// @desc    Resend invitation to a client
// @route   POST /api/v1/clients/:tenantId/:clientId/resend-invitation
// @access  Private
const resendInvitation = asyncHandler(async (req, res) => {
  const { tenantId, clientId } = req.params;

  const client = await Client.findById(clientId);

  if (!client) {
    return sendResponse(res, 404, 'Client not found', null, false);
  }

  if (client.invitationToken === null) {
    return sendResponse(res, 400, 'Client has already been activated and cannot be invited again.', null, false);
  }

  const invitationToken = crypto.randomBytes(32).toString('hex');
  client.invitationToken = invitationToken;
  await client.save();

  await sendInvitationEmail(tenantId, client.name, client.email, invitationToken);

  sendResponse(res, 200, 'Invitation resent successfully.', {});
});

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  resendInvitation,
  getClientListForDropdown
};