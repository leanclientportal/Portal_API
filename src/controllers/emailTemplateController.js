const EmailTemplate = require('../models/EmailTemplate');
const asyncHandler = require('../middlewares/asyncHandler');
const sendResponse = require('../utils/apiResponse');

// @desc    Get all email templates for a tenant
// @route   GET /api/v1/email-templates
// @access  Private
const getEmailTemplates = asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const templates = await EmailTemplate.find({ tenantId, isActive: true });

  sendResponse(res, 200, 'Email templates retrieved successfully', templates);
});

// @desc    Create a new email template
// @route   POST /api/v1/email-templates
// @access  Private
const createEmailTemplate = asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { templateId, name, subject, body, isDefault } = req.body;

  const newTemplate = await EmailTemplate.create({
    tenantId,
    templateId,
    name,
    subject,
    body,
    isDefault: isDefault || false
  });

  sendResponse(res, 201, 'Email template created successfully', newTemplate);
});

// @desc    Update an email template
// @route   PUT /api/v1/email-templates/:id
// @access  Private
const updateEmailTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;

  // Prevent updating tenantId
  if (req.body.tenantId) {
    delete req.body.tenantId;
  }

  const updatedTemplate = await EmailTemplate.findOneAndUpdate(
    { _id: id, tenantId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!updatedTemplate) {
    return sendResponse(res, 404, 'Email template not found', null, false);
  }

  sendResponse(res, 200, 'Email template updated successfully', updatedTemplate);
});

// @desc    Delete an email template (soft delete)
// @route   DELETE /api/v1/email-templates/:id
// @access  Private
const deleteEmailTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;

  const template = await EmailTemplate.findOneAndUpdate(
    { _id: id, tenantId },
    { isActive: false },
    { new: true }
  );

  if (!template) {
    return sendResponse(res, 404, 'Email template not found', null, false);
  }

  sendResponse(res, 200, 'Email template deleted successfully', {});
});

module.exports = {
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
};
