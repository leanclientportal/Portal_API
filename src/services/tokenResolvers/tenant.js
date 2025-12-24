const Tenant = require('../../models/Tenant');

async function getTenantDetails(tenantId) {
  if (!tenantId) return null;
  return Tenant.findById(tenantId).lean();
}

module.exports = { getTenantDetails };