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
    .select('-__v +invitationToken')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await Client.countDocuments(query);

  const clientsWithProjects = await Promise.all(
    clients.map(async (client) => {
      const totalProjects = await Project.countDocuments({ clientId: client._id, isActive: true });
      return { ...client.toObject(), totalProjects };
    })
  );

  res.status(200).json({
    success: true,
    message: 'Clients retrieved successfully',
    data: {
      clients: clientsWithProjects,
      pagination: { current: parseInt(page), total: Math.ceil(total / limit), count: clients.length, totalRecords: total },
    },
  });
});

// @desc    Get a single client by client id
// @route   GET /api/v1/clients/:tenantId/:clientId
// @access  Private
const getClientById = asyncHandler(async (req, res) => {
  const { tenantId, clientId } = req.params;

  const mapping = await TenantClientMapping.findOne({ tenantId, clientId });
  if (!mapping) {
    res.status(404);
    throw new Error('Client not found for this tenant');
  }

  const client = await Client.findOne({ _id: clientId, isActive: true }).select('-__v +invitationToken');

  if (!client) {
    res.status(404);
    throw new Error('Client not found');
  }

  res.status(200).json({ success: true, message: 'Client retrieved successfully', data: client });
});

// @desc    Create new client and mapping
// @route   POST /api/v1/clients/:tenantId
// @access  Private
const createClient = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const { name, email, phone, profileImageUrl } = req.body;

  if (!name || !email) {
    res.status(400);
    throw new Error('Please provide name and email');
  }

  const invitationToken = crypto.randomBytes(32).toString('hex');

  let client = await Client.findOne({ email });
  if (client) {
    const existingMapping = await TenantClientMapping.findOne({ tenantId, clientId: client._id });
    if (existingMapping) {
      res.status(400);
      throw new Error('A client with this email already exists and is mapped to this tenant');
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

  res.status(201).json({ success: true, message: 'Client created and invitation sent successfully.', data: client });
});

// @desc    Update client
// @route   PUT /api/v1/clients/:tenantId/:clientId
// @access  Private
const updateClient = asyncHandler(async (req, res) => {
  const { tenantId, clientId } = req.params;

  const mapping = await TenantClientMapping.findOne({ tenantId, clientId });
  if (!mapping) {
    res.status(404);
    throw new Error('Client not found for this tenant');
  }

  const updateData = {
    ...req.body,
    lastActivityDate: new Date(),
  };

  const client = await Client.findOneAndUpdate({ _id: clientId }, updateData, { new: true, runValidators: true });

  if (!client) {
    res.status(404);
    throw new Error('Client not found');
  }

  res.status(200).json({ success: true, message: 'Client updated successfully', data: client });
});

// @desc    Delete client (soft delete)
// @route   DELETE /api/v1/clients/:tenantId/:clientId
// @access  Private
const deleteClient = asyncHandler(async (req, res) => {
  const { tenantId, clientId } = req.params;

  const mapping = await TenantClientMapping.findOne({ tenantId, clientId });
  if (!mapping) {
    res.status(404);
    throw new Error('Client not found for this tenant');
  }

  const client = await Client.findOneAndUpdate({ _id: clientId }, { isActive: false }, { new: true });

  if (!client) {
    res.status(404);
    throw new Error('Client not found');
  }

  res.status(200).json({ success: true, message: 'Client deleted successfully' });
});

// @desc    Resend invitation to a client
// @route   POST /api/v1/clients/:tenantId/:clientId/resend-invitation
// @access  Private
const resendInvitation = asyncHandler(async (req, res) => {
  const { tenantId, clientId } = req.params;

  const client = await Client.findById(clientId);

  if (!client) {
    res.status(404);
    throw new Error('Client not found');
  }
  console.log(client);
  if (client.invitationToken === null) {
    res.status(400);
    throw new Error('Client has already been activated and cannot be invited again.');
  }

  const invitationToken = crypto.randomBytes(32).toString('hex');
  client.invitationToken = invitationToken;
  await client.save();

  await sendInvitationEmail(tenantId, client.name, client.email, invitationToken);

  res.status(200).json({ success: true, message: 'Invitation resent successfully.' });
});

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  resendInvitation,
};