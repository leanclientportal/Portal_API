const Tenant = require('../models/Tenant');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get tenant details
// @route   GET /api/v1/tenant/:tenantId
// @access  Private
const getTenant = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;

  const tenant = await Tenant.findById(tenantId).populate('subscription.planId');

  if (!tenant) {
    return res.status(404).json({
      success: false,
      message: 'Tenant not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Tenant details retrieved successfully',
    data: tenant
  });
});

// @desc    Update tenant details
// @route   PUT /api/v1/tenant/:tenantId
// @access  Private
const updateTenant = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;

  const tenant = await Tenant.findByIdAndUpdate(
    tenantId,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('subscription.planId');

  if (!tenant) {
    return res.status(404).json({
      success: false,
      message: 'Tenant not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Tenant updated successfully',
    data: tenant
  });
});

module.exports = {
  getTenant,
  updateTenant
};