const Client = require('../models/Client');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Invoice = require('../models/Invoice');
const Document = require('../models/Document');
const NotificationLog = require('../models/NotificationLog');
const asyncHandler = require('../middlewares/asyncHandler');
const sendResponse = require('../utils/apiResponse');

// @desc    Get dashboard widgets
// @route   GET /api/v1/dashboard/:tenantId
// @access  Private
const dashboardWidgets = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;

  // Total Clients
  const totalClients = await Client.countDocuments({ tenantId, isDeleted: false });

  // Active Projects
  const clients = await Client.find({ tenantId, isDeleted: false }).select('_id');
  const clientIds = clients.map(client => client._id);
  const activeProjects = await Project.countDocuments({ tenantId, clientId: { $in: clientIds }, status: 'Active' });

  // Pending Tasks
  const projects = await Project.find({ tenantId, clientId: { $in: clientIds }, status: 'Active' }).select('_id');
  const projectIds = projects.map(project => project._id);
  const pendingTasks = await Task.countDocuments({ projectId: { $in: projectIds }, status: { $in: ['Pending', 'In-Progress'] } });

  // Outstanding Invoices
  const outstandingInvoices = await Invoice.countDocuments({ projectId: { $in: projectIds }, status: { $in: ['Unpaid', 'Due'] } });

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

  const topClients = await Client.find({ tenantId, isDeleted: false }).sort({ lastActiveDate: -1 }).limit(5);

  const topProjects = await Project.find({ tenantId, isDeleted: false }).sort({ lastActiveDate: -1 }).limit(5);

  const projects = await Project.find({ tenantId, isDeleted: false }).select('_id');
  const projectIds = projects.map(project => project._id);

  const latestTasks = await Task.find({ projectId: { $in: projectIds } }).sort({ createdAt: -1 }).limit(5);

  const latestDocuments = await Document.find({ projectId: { $in: projectIds } }).sort({ createdAt: -1 }).limit(5);

  const latestInvoices = await Invoice.find({ projectId: { $in: projectIds } }).sort({ createdAt: -1 }).limit(5);

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
