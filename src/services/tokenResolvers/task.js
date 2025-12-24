const Task = require('../../models/Task');

async function getTaskDetails(taskId) {
  if (!taskId) return null;
  return Task.findById(taskId).lean();
}

module.exports = { getTaskDetails };