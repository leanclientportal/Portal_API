const Project = require('../models/Project');
const asyncHandler = require('../middlewares/asyncHandler');
const TenantClientMapping = require('../models/TenantClientMapping');
const sendResponse = require('../utils/apiResponse');
const { sendNewProjectEmail, sendProjectStatusChangeEmail } = require('../utils/emailUtils');
const Client = require('../models/Client');
const Tenant = require('../models/Tenant');

// @desc    Get all projects
// @route   POST /api/v1/projects/:activeProfile/:activeProfileId
// @access  Private
const getProjects = asyncHandler(async (req, res) => {
  const { activeProfile, activeProfileId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const { searchTerm, selectedClient, dateFrom, dateTo } = req.body;

  const query = { isDeleted: false };

  if (!activeProfile || !activeProfileId) {
    return sendResponse(res, 400, 'Active profile and ID are required', null, false);
  }

  if (activeProfile === 'tenant') {
    query.tenantId = activeProfileId;
    if (selectedClient) {
      query.clientId = selectedClient;
    } else {
      const clientMappings = await TenantClientMapping.find({ tenantId: activeProfileId }).select('clientId');
      const clientIds = clientMappings.map(mapping => mapping.clientId);
      query.clientId = { $in: clientIds };
    }
  } else if (activeProfile === 'client') {
    query.clientId = activeProfileId;
    const tenantMappings = await TenantClientMapping.find({ clientId: activeProfileId }).select('tenantId');
    const tenantIds = tenantMappings.map(mapping => mapping.tenantId);
    query.tenantId = { $in: tenantIds };
  } else {
    return sendResponse(res, 400, 'Invalid active profile', null, false);
  }

  if (searchTerm) {
    query.$or = [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } }
    ];
  }

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) {
      query.createdAt.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      query.createdAt.$lte = new Date(dateTo);
    }
  }

  // Execute query with pagination
  const projects = await Project.find(query)
    .populate('clientId', 'name email company')
    .populate('tenantId', 'companyName email company')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Project.countDocuments(query);

  const pagination = {
    current: parseInt(page),
    total: Math.ceil(total / limit),
    count: projects.length,
    totalRecords: total
  };

  sendResponse(res, 200, 'Projects retrieved successfully', { projects }, pagination);
});

// @desc    Create new project
// @route   POST /api/v1/projects/:tenantId/:clientId
// @access  Private
const createProject = asyncHandler(async (req, res) => {
  const { tenantId, clientId } = req.params;

  const project = await Project.create({
    name: req.body.name,
    description: req.body.description,
    status: req.body.status,
    tenantId,
    clientId,
    lastActivityDate: new Date(),
    isDeleted: false,
  });

  await project.save();

  try {
    const client = await Client.findById(clientId);
    const tenant = await Tenant.findById(tenantId);
    if (client && tenant && tenant.emailSetting && tenant.emailSetting.newProject) {
      await sendNewProjectEmail(tenant, client, project);
      console.error(`project under`);
    }
    console.error(`Failed to send new project email`);
  } catch (emailError) {
    console.error(`Failed to send new project email for project ${project._id}:`, emailError);
  }

  sendResponse(res, 201, 'Project created successfully', project);
});

// @desc    Get project details
// @route   GET /api/v1/projects/:projectId
// @access  Private
const getProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findOne({
    _id: projectId
  }).populate('clientId', 'name email company').populate('tenantId', 'name email company');

  if (!project) {
    return sendResponse(res, 404, 'Project not found', null, false);
  }

  sendResponse(res, 200, 'Project details retrieved successfully', project);
});

// @desc    Update project
// @route   PUT /api/v1/projects/:projectId
// @access  Private
const updateProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const projectBeforeUpdate = await Project.findById(projectId);
  if (!projectBeforeUpdate) {
    return sendResponse(res, 404, 'Project not found', null, false);
  }
  const oldStatus = projectBeforeUpdate.status;

  const updateData = {
    ...req.body,
    lastActivityDate: new Date(),
  };

  const project = await Project.findOneAndUpdate(
    { _id: projectId },
    updateData,
    {
      new: true,
      runValidators: true
    }
  ).populate('clientId', 'name email company').populate('tenantId', 'name email company');

  if (!project) {
    return sendResponse(res, 404, 'Project not found', null, false);
  }

  const newStatus = project.status;
  if (oldStatus !== newStatus) {
    try {
      const client = await Client.findById(project.clientId);
      const tenant = await Tenant.findById(project.tenantId);
      if (client && tenant && tenant.emailSetting && tenant.emailSetting.projectStatusChange) {
        await sendProjectStatusChangeEmail(project.tenantId, client.email, { name: project.name, status: newStatus });
      }
    } catch (emailError) {
      console.error(`Failed to send project status change email for project ${project._id}:`, emailError);
    }
  }

  sendResponse(res, 200, 'Project updated successfully', project);
});

// @desc    Delete project (soft delete)
// @route   DELETE /api/v1/projects/:projectId
// @access  Private
const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findOneAndUpdate(
    { _id: projectId },
    { isDeleted: true },
    { new: true }
  );

  if (!project) {
    return sendResponse(res, 404, 'Project not found', null, false);
  }

  sendResponse(res, 200, 'Project deleted successfully', {});
});

module.exports = {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject
};