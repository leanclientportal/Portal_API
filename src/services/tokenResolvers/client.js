const Client = require('../../models/Client');
const TenantClientMapping = require('../../models/TenantClientMapping');

async function getClientDetails(clientId) {
  if (!clientId) return null;
  return Client.findById(clientId).lean();
}
async function getClientCount(tenantId) {
  if (!tenantId) return null;
  return await TenantClientMapping.countDocuments({ tenant: tenantId });
}
module.exports = { getClientDetails, getClientCount };