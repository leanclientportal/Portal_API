const Task = require('../models/Task');
const asyncHandler = require('../middlewares/asyncHandler');
const sendResponse = require('../utils/apiResponse');
const { sendNewTaskEmail, sendTaskUpdateEmail } = require('../utils/emailUtils');
const Project = require('../models/Project');
const Client = require('../models/Client');
const Tenant = require('../models/Tenant');

// @desc    Get all tasks for a project
// @route   GET /api/v1/tasks/:projectId/:activeProfileId
// @access  Private
const getTasks = asyncHandler(async (req, res) => {
  const { projectId, activeProfile } = req.params;
  const { page = 1, limit = 20, search, status } = req.query;

  // Build query
  const query = { projectId, isActive: true };

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) {
    query.status = status;
  }
  if (activeProfile === 'client') {
    query.visibleToClient = true;
  }

  // Execute query with pagination
  const tasks = await Task.find(query)
    .populate('projectId', 'name')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Task.countDocuments(query);

  const pagination = {
    current: parseInt(page),
    total: Math.ceil(total / limit),
    count: tasks.length,
    totalRecords: total
  };

  sendResponse(res, 200, 'Tasks retrieved successfully', { tasks }, pagination);
});

// @desc    Create new task
// @route   POST /api/v1/tasks/:projectId
// @access  Private
const createTask = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const task = await Task.create({
    ...req.body,
    projectId
  });

  await task.populate([
    { path: 'projectId', select: 'name tenantId clientId' }
  ]);

  try {
    const project = await Project.findById(projectId).populate('clientId');
    const tenant = await Tenant.findById(project.tenantId);
    if (project && project.clientId && tenant && tenant.emailSetting && tenant.emailSetting.newTask) {
      await sendNewTaskEmail(project.tenantId, project.clientId._id, projectId, project.clientId.email, task._id);
    }
  } catch (emailError) {
    console.error(`Failed to send new task email for task ${task._id}:`, emailError);
  }

  sendResponse(res, 201, 'Task created successfully', task);
});

// @desc    Update task
// @route   PUT /api/v1/tasks/:projectId/:taskId
// @access  Private
const updateTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;

  const taskBeforeUpdate = await Task.findById(taskId);
  if (!taskBeforeUpdate) {
    return sendResponse(res, 404, 'Task not found', null, false);
  }
  const oldStatus = taskBeforeUpdate.status;

  const task = await Task.findOneAndUpdate(
    { _id: taskId, projectId },
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate([
    { path: 'projectId', select: 'name tenantId clientId' }
  ]);

  if (!task) {
    return sendResponse(res, 404, 'Task not found', null, false);
  }

  const newStatus = task.status;
  if (oldStatus !== newStatus) {
    try {
      const project = await Project.findById(projectId).populate('clientId');
      const tenant = await Tenant.findById(project.tenantId);
      if (project && project.clientId && tenant && tenant.emailSetting && tenant.emailSetting.taskUpdate) {
        await sendTaskUpdateEmail(project.tenantId, project.clientId._id, projectId, project.clientId.email, taskId);
      }
    } catch (emailError) {
      console.error(`Failed to send task update email for task ${task._id}:`, emailError);
    }
  }

  sendResponse(res, 200, 'Task updated successfully', task);
});

// @desc    Delete task (soft delete)
// @route   DELETE /api/v1/tasks/:projectId/:taskId
// @access  Private
const deleteTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;

  const task = await Task.findOneAndUpdate(
    { _id: taskId, projectId },
    { isActive: false },
    { new: true }
  );

  if (!task) {
    return sendResponse(res, 404, 'Task not found', null, false);
  }

  sendResponse(res, 200, 'Task deleted successfully', {});
});

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask
};