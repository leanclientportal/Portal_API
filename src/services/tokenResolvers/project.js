const Project = require('../../models/Project');

async function getProjectDetails(projectId) {
  if (!projectId) return null;
  return Project.findById(projectId).lean();
}

module.exports = { getProjectDetails };