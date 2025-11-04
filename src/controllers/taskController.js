const Task = require('../models/Task');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get all tasks for a project
// @route   GET /api/v1/tasks/:projectId
// @access  Private
const getTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { page = 1, limit = 20, search, status, visibleToClient } = req.query;

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

  if (typeof visibleToClient !== 'undefined') {
    query.visibleToClient = visibleToClient === 'true';
  }

  // Execute query with pagination
  const tasks = await Task.find(query)
    .populate('projectId', 'name')
    .select('-__v')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Task.countDocuments(query);

  res.status(200).json({
    success: true,
    message: 'Tasks retrieved successfully',
    data: {
      tasks,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: tasks.length,
        totalRecords: total
      }
    }
  });
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
    { path: 'projectId', select: 'name' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: task
  });
});

// @desc    Update task
// @route   PUT /api/v1/tasks/:projectId/:taskId
// @access  Private
const updateTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;

  const task = await Task.findOneAndUpdate(
    { _id: taskId, projectId },
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate([
    { path: 'projectId', select: 'name' }
  ]);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    data: task
  });
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
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully'
  });
});

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask
};