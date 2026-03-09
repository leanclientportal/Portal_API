const Project = require('../../models/Project');

async function getProjectDetails(projectId) {
  if (!projectId) return null;
  return Project.findById(projectId).lean();
}
async function getProjectCount(tenantId) {
  if (!tenantId) return null;
  return await Project.countDocuments({ tenant: tenantId });
}

module.exports = { getProjectDetails, getProjectCount };