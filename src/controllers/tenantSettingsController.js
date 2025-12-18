const Tenant = require('../models/Tenant');
const asyncHandler = require('../middlewares/asyncHandler');
const sendResponse = require('../utils/apiResponse');

// @desc    Get SMTP settings for a tenant
// @route   GET /api/v1/tenant/:tenantId/settings/smtp
// @access  Private
exports.getSmtpSettings = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;

  const tenant = await Tenant.findById(tenantId).select('smtpSetting');

  if (!tenant) {
    return sendResponse(res, 404, 'Tenant not found', null, false);
  }

  sendResponse(res, 200, 'SMTP settings retrieved successfully', tenant.smtpSetting);
});

// @desc    Update SMTP settings for a tenant
// @route   PUT /api/v1/tenant/:tenantId/settings/smtp
// @access  Private
exports.updateSmtpSettings = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const smtpSetting = req.body;

  const tenant = await Tenant.findById(tenantId);

  if (!tenant) {
    return sendResponse(res, 404, 'Tenant not found', null, false);
  }

  if (!smtpSetting || Object.keys(smtpSetting).length === 0) {
    return sendResponse(res, 400, 'Smtp settings are required', null, false);
  }

  const updatedTenant = await Tenant.findByIdAndUpdate(
    tenantId,
    { $set: { smtpSetting } },
    { new: true, runValidators: true }
  );

  if (!updatedTenant) {
    return sendResponse(res, 404, 'Tenant not found', null, false);
  }

  sendResponse(res, 200, 'SMTP settings updated successfully', updatedTenant.smtpSetting);
});

// @desc    Get email settings for a tenant
// @route   GET /api/v1/tenant/:tenantId/settings/email
// @access  Private
exports.getEmailSettings = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;

  const tenant = await Tenant.findById(tenantId).select('emailSetting');

  if (!tenant) {
    return sendResponse(res, 404, 'Tenant not found', null, false);
  }

  sendResponse(res, 200, 'Email settings retrieved successfully', tenant.emailSetting);
});

// @desc    Update email settings for a tenant
// @route   PUT /api/v1/tenant/:tenantId/settings/email
// @access  Private
exports.updateEmailSettings = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const emailSetting = req.body;

  const tenant = await Tenant.findById(tenantId);

  if (!tenant) {
    return sendResponse(res, 404, 'Tenant not found', null, false);
  }

  if (!emailSetting || Object.keys(emailSetting).length === 0) {
    return sendResponse(res, 400, 'Email settings are required', null, false);
  }

  const updatedTenant = await Tenant.findByIdAndUpdate(
    tenantId,
    { $set: { emailSetting } },
    { new: true, runValidators: true }
  );

  if (!updatedTenant) {
    return sendResponse(res, 404, 'Tenant not found', null, false);
  }

  sendResponse(res, 200, 'Email settings updated successfully', updatedTenant.emailSetting);
});
