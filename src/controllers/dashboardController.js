const Client = require('../models/Client');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Invoice = require('../models/Invoice');
const Document = require('../models/Document');
const NotificationLog = require('../models/NotificationLog');
const TenantClientMapping = require('../models/TenantClientMapping');
const asyncHandler = require('../middlewares/asyncHandler');
const sendResponse = require('../utils/apiResponse');

// @desc    Get dashboard widgets
// @route   GET /api/v1/dashboard/:tenantId
// @access  Private
const dashboardWidgets = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;

  const clientMappings = await TenantClientMapping.find({ tenantId }).select('clientId');
  const clientIds = clientMappings.map(mapping => mapping.clientId);

  // Total Clients
  const totalClients = await Client.countDocuments({ _id: { $in: clientIds }, isActive: true });

  // Active Projects
  const activeProjects = await Project.countDocuments({ tenantId, clientId: { $in: clientIds }, status: 'active', isDeleted: false });

  // Pending Tasks
  const projects = await Project.find({ tenantId, clientId: { $in: clientIds }, isDeleted: false }).select('_id');
  const projectIds = projects.map(project => project._id);
  const pendingTasks = await Task.countDocuments({ projectId: { $in: projectIds }, status: { $in: ['pending'] } });

  // Outstanding Invoices
  const result = await Invoice.aggregate([
    {
      $match: {
        projectId: { $in: projectIds },
        status: { $in: ['pending'] }
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

  const widgets = {
    totalClients,
    activeProjects,
    pendingTasks,
    outstandingInvoices,
  };

  sendResponse(res, 200, 'Dashboard widgets retrieved successfully', widgets);
});


// @desc    Get dashboard overview
// @route   GET /api/v1/dashboard/overview/:tenantId
// @access  Private
const dashboardOverview = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;

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

  const overview = {
    topClients,
    topProjects,
    latestTasks,
    latestDocuments,
    latestInvoices,
  };

  sendResponse(res, 200, 'Dashboard overview retrieved successfully', overview);
});

module.exports = {
  dashboardWidgets,
  dashboardOverview,
};
