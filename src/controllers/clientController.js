const Client = require('../models/Client');
const Project = require('../models/Project');
const TenantClientMapping = require('../models/TenantClientMapping');
const User = require('../models/User'); // Added User model import
const UserTenantClientMapping = require('../models/UserTenantClientMapping'); // Added UserTenantClientMapping model import
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get all clients for a tenant
// @route   GET /api/v1/clients/:tenantId
// @access  Private
const getClients = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const { page = 1, limit = 20, search, status } = req.query;

  // Find all client IDs associated with the tenant
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
    .select('-__v')
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

  // Verify that the client is mapped to the tenant
  const mapping = await TenantClientMapping.findOne({ tenantId, clientId });
  if (!mapping) {
    res.status(404);
    throw new Error('Client not found for this tenant');
  }

  const client = await Client.findOne({ _id: clientId, isActive: true }).select('-__v');

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
  const { name, email, phone, profileImageUrl } = req.body; // Added password

  if (!name || !email || !phone) { // Added password to validation
    res.status(400);
    throw new Error('Please provide name, email, and phone');
  }

  // Check if a client with this email already exists and is mapped to this tenant
  let client = await Client.findOne({ email });
  if (client) {
    const existingMapping = await TenantClientMapping.findOne({ tenantId, clientId: client._id });
    if (existingMapping) {
      res.status(400);
      throw new Error('A client with this email already exists and is mapped to this tenant');
    }
  } else {
    // Create the new client if not existing
    client = await Client.create({ name, email, phone, profileImageUrl });
  }

  // Create the mapping between the tenant and the new/existing client
  await TenantClientMapping.create({
    tenantId,
    clientId: client._id,
  });

  // Check if a user with this email already exists
  let user = await User.findOne({ email });

  if (!user) {
    // Create the new user
    user = await User.create({
      name,
      email,
      activeProfile: 'client',
      activeProfileId: client._id, // Link to the newly created client
    });
  }

  // Create mapping between user, tenant, and client
  await UserTenantClientMapping.create({
    userId: user._id,
    tenantId,
    clientId: client._id,
    role: 'client', // Assuming 'client' role for this mapping
  });

  res.status(201).json({ success: true, message: 'Client created and mapped successfully.', data: client });
});

// @desc    Update client
// @route   PUT /api/v1/clients/:tenantId/:clientId
// @access  Private
const updateClient = asyncHandler(async (req, res) => {
  const { tenantId, clientId } = req.params;

  // Verify that the client is mapped to the tenant
  const mapping = await TenantClientMapping.findOne({ tenantId, clientId });
  if (!mapping) {
    res.status(404);
    throw new Error('Client not found for this tenant');
  }

  const client = await Client.findOneAndUpdate({ _id: clientId }, req.body, { new: true, runValidators: true });

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

  // Verify that the client is mapped to the tenant
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

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
};