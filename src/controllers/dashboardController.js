const Client = require('../models/Client');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Invoice = require('../models/Invoice');
const Document = require('../models/Document');
const TenantClientMapping = require('../models/TenantClientMapping');
const asyncHandler = require('../middlewares/asyncHandler');
const sendResponse = require('../utils/apiResponse');
const config = require('../config');
const Tenant = require('../models/Tenant');

// @desc    Get dashboard widgets
// @route   GET /api/v1/dashboard/:activeProfileId/:activeProfile
// @access  Private
const dashboardWidgets = asyncHandler(async (req, res) => {
  const { activeProfileId, activeProfile } = req.params;
  let tenantId;
  let clientId;

  let widgets = {};

  if (activeProfile === config.Tenant) {
    tenantId = activeProfileId;
    const clientMappings = await TenantClientMapping.find({ tenantId }).select('clientId');
    const clientIds = clientMappings.map(mapping => mapping.clientId);

    const totalClients = await Client.countDocuments({ _id: { $in: clientIds }, isActive: true });
    const activeProjects = await Project.countDocuments({ tenantId, clientId: { $in: clientIds }, status: 'active', isDeleted: false });

    const projects = await Project.find({ tenantId, clientId: { $in: clientIds }, isDeleted: false }).select('_id');
    const projectIds = projects.map(project => project._id);
    const pendingTasks = await Task.countDocuments({ projectId: { $in: projectIds }, status: { $in: ['todo'] } });

    const result = await Invoice.aggregate([
      {
        $match: {
          projectId: { $in: projectIds },
          status: { $in: ['pending'] },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: null,
          amount: { $sum: '$amount' }
        }
      }
    ]);

    const outstandingInvoices = result.length > 0 ? result[0].amount : 0;

    widgets = {
      totalClients,
      activeProjects,
      pendingTasks,
      outstandingInvoices,
    };

  } else if (activeProfile === config.Client) {
    clientId = activeProfileId;
    const tcMappings = await TenantClientMapping.find({ clientId }).select('tenantId');
    const tenantIds = tcMappings.map(mapping => mapping.tenantId);

    const totalTenants = await Tenant.countDocuments({ _id: { $in: tenantIds }, isActive: true });
    const activeProjects = await Project.countDocuments({ tenantId: { $in: tenantIds }, clientId, status: 'active', isDeleted: false });

    const projects = await Project.find({ tenantId: { $in: tenantIds }, clientId, isDeleted: false }).select('_id');
    const projectIds = projects.map(project => project._id);
    const pendingTasks = await Task.countDocuments({ projectId: { $in: projectIds }, status: { $in: ['todo'] } });

    const result = await Invoice.aggregate([
      {
        $match: {
          projectId: { $in: projectIds },
          status: { $in: ['pending'] },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: null,
          amount: { $sum: '$amount' }
        }
      }
    ]);

    const outstandingInvoices = result.length > 0 ? result[0].amount : 0;

    widgets = {
      totalTenants,
      activeProjects,
      pendingTasks,
      outstandingInvoices,
    };
  }

  sendResponse(res, 200, 'Dashboard widgets retrieved successfully', widgets);
});

// @desc    Get dashboard overview
// @route   GET /api/v1/dashboard/overview/:activeProfileId/:activeProfile
// @access  Private
const dashboardOverview = asyncHandler(async (req, res) => {
  const { activeProfileId, activeProfile } = req.params;
  let tenantId;
  let clientId;
  let overview;

  if (activeProfile === config.Tenant) {
    tenantId = activeProfileId;
    const clientMappings = await TenantClientMapping.find({ tenantId }).select('clientId');
    const mapClientIds = clientMappings.map(mapping => mapping.clientId);

    const topClients = await Client.find({ _id: { $in: mapClientIds }, isActive: true }).sort({ lastActivityDate: -1 }).limit(5);

    const allClients = await Client.find({ _id: { $in: mapClientIds }, isActive: true }).sort({ lastActivityDate: -1 }).select('_id');
    const clientIds = allClients.map(mapping => mapping._id);

    const topProjects = await Project.find({ tenantId, clientId: { $in: clientIds }, isDeleted: false }).sort({ lastActivityDate: -1 }).limit(5);

    const projects = await Project.find({ tenantId, clientId: { $in: clientIds }, isDeleted: false }).select('_id');
    const projectIds = projects.map(project => project._id);

    const latestTasks = await Task.find({ projectId: { $in: projectIds }, isActive: true }).sort({ createdAt: -1 }).limit(5);

    const latestDocuments = await Document.find({ projectId: { $in: projectIds } }).sort({ createdAt: -1 }).limit(5);

    const latestInvoices = await Invoice.find({ projectId: { $in: projectIds }, isDeleted: false }).sort({ createdAt: -1 }).limit(5);

    overview = {
      topClients,
      topProjects,
      latestTasks,
      latestDocuments,
      latestInvoices,
    };

  } else if (activeProfile === config.Client) {
    clientId = activeProfileId;
    const tenantMappings = await TenantClientMapping.find({ clientId }).select('tenantId');
    const mapTenantIds = tenantMappings.map(mapping => mapping.tenantId);

    const topTenants = await Tenant.find({ _id: { $in: mapTenantIds }, isActive: true }).sort({ lastActivityDate: -1 }).limit(5);

    const allTenants = await Tenant.find({ _id: { $in: mapTenantIds }, isActive: true }).sort({ lastActivityDate: -1 }).select('_id');
    const tenantIds = allTenants.map(mapping => mapping._id);

    const topProjects = await Project.find({ clientId, tenantId: { $in: tenantIds }, isDeleted: false }).sort({ lastActivityDate: -1 }).limit(5);

    const projects = await Project.find({ clientId, tenantId: { $in: tenantIds }, isDeleted: false }).select('_id');
    const projectIds = projects.map(project => project._id);

    const latestTasks = await Task.find({ projectId: { $in: projectIds }, isActive: true }).sort({ createdAt: -1 }).limit(5);

    const latestDocuments = await Document.find({ projectId: { $in: projectIds } }).sort({ createdAt: -1 }).limit(5);

    const latestInvoices = await Invoice.find({ projectId: { $in: projectIds }, isDeleted: false }).sort({ createdAt: -1 }).limit(5);

    overview = {
      topTenants,
      topProjects,
      latestTasks,
      latestDocuments,
      latestInvoices,
    };
  }

  if (!overview) {
    return sendResponse(res, 400, 'Invalid profile or ID');
  }



  sendResponse(res, 200, 'Dashboard overview retrieved successfully', overview);
});

module.exports = {
  dashboardWidgets,
  dashboardOverview,
};