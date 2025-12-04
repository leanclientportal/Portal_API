const EmailTemplate = require('../models/EmailTemplate');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get all email templates for a tenant
// @route   GET /api/v1/email-templates
// @access  Private
const getEmailTemplates = asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const templates = await EmailTemplate.find({ tenantId, isActive: true });

  res.status(200).json({
    success: true,
    count: templates.length,
    data: templates,
  });
});

// @desc    Create a new email template
// @route   POST /api/v1/email-templates
// @access  Private
const createEmailTemplate = asyncHandler(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { templateId, name, subject, body, variables, type } = req.body;

  const newTemplate = await EmailTemplate.create({
    tenantId,
    templateId,
    name,
    subject,
    body,
    variables,
    type,
  });

  res.status(201).json({
    success: true,
    message: 'Email template created successfully',
    data: newTemplate,
  });
});

// @desc    Update an email template
// @route   PUT /api/v1/email-templates/:id
// @access  Private
const updateEmailTemplate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;

  const updatedTemplate = await EmailTemplate.findOneAndUpdate(
    { _id: id, tenantId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!updatedTemplate) {
    return res.status(404).json({ success: false, message: 'Email template not found' });
  }

  res.status(200).json({
    success: true,
    message: 'Email template updated successfully',
    data: updatedTemplate,
  });
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
    return res.status(404).json({ success: false, message: 'Email template not found' });
  }

  res.status(200).json({
    success: true,
    message: 'Email template deleted successfully',
    data: {},
  });
});

module.exports = {
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
};
