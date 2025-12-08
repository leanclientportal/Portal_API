const Tenant = require('../models/Tenant');
const TenantClientMapping = require('../models/TenantClientMapping');
const asyncHandler = require('../middlewares/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all tenants associated with a specific client
// @route   GET /api/v1/tenants/by-client/:clientId
// @access  Private
exports.getTenantsByClientId = asyncHandler(async (req, res, next) => {
  const { clientId } = req.params;

  // Find all tenant mappings for the given client ID
  const mappings = await TenantClientMapping.find({ clientId });

  if (!mappings || mappings.length === 0) {
    return res.status(200).json({
      success: true,
      data: [],
      message: 'No tenants found for the provided client ID.'
    });
  }

  // Extract the tenant IDs from the mappings
  const tenantIds = mappings.map(mapping => mapping.tenantId);

  // Find all tenants that match the extracted IDs
  const tenants = await Tenant.find({ '_id': { $in: tenantIds } }).select('_id name');

  const formattedTenants = tenants.map(tenant => ({
    value: tenant._id,
    label: tenant.companyName,
  }));

  res.status(200).json({
    success: true,
    count: tenants.length,
    data: formattedTenants,
  });
});
