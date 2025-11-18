const Project = require('../models/Project');
const asyncHandler = require('../middlewares/asyncHandler');
const TenantClientMapping = require('../models/TenantClientMapping');

// @desc    Get all projects
// @route   GET /api/v1/projects/:activeProfile/:activeProfileId
// @access  Private
const getProjects = asyncHandler(async (req, res) => {
  const { activeProfile, activeProfileId } = req.params;
  const { page = 1, limit = 20, search, status } = req.query;
  const query = { isActive: true };

  if (!activeProfile || !activeProfileId) {
    return res.status(400).json({ success: false, message: 'Active profile and ID are required' });
  }

  if (activeProfile === 'tenant') {
    query.tenantId = activeProfileId;
    const clientMappings = await TenantClientMapping.find({ tenantId: activeProfileId }).select('clientId');
    const clientIds = clientMappings.map(mapping => mapping.clientId);
    query.clientId = { $in: clientIds };
  } else if (activeProfile === 'client') {
    query.clientId = activeProfileId;
    const tenantMappings = await TenantClientMapping.find({ clientId: activeProfileId }).select('tenantId');
    const tenantIds = tenantMappings.map(mapping => mapping.tenantId);
    query.tenantId = { $in: tenantIds };
  } else {
    return res.status(400).json({ success: false, message: 'Invalid active profile' });
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) {
    query.status = status;
  }

  // Execute query with pagination
  const projects = await Project.find(query)
    .populate('clientId', 'name email company')
    .select('-__v')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Project.countDocuments(query);

  res.status(200).json({
    success: true,
    message: 'Projects retrieved successfully',
    data: {
      projects,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: projects.length,
        totalRecords: total
      }
    }
  });
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
    isActive: req.body.isActive,
    tenantId,
    clientId
  });

  await project.populate('clientId', 'name email company');

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: project
  });
});

// @desc    Get project details
// @route   GET /api/v1/projects/:projectId
// @access  Private
const getProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findOne({
    _id: projectId,
    isActive: true
  }).populate('clientId', 'name email company');

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Project details retrieved successfully',
    data: project
  });
});

// @desc    Update project
// @route   PUT /api/v1/projects/:projectId
// @access  Private
const updateProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findOneAndUpdate(
    { _id: projectId },
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('clientId', 'name email company');

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    data: project
  });
});

// @desc    Delete project (soft delete)
// @route   DELETE /api/v1/projects/:projectId
// @access  Private
const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findOneAndUpdate(
    { _id: projectId },
    { isActive: false },
    { new: true }
  );

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Project deleted successfully'
  });
});

module.exports = {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject
};