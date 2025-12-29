const EmailTemplate = require('../models/EmailTemplate');
const asyncHandler = require('../middlewares/asyncHandler');
const sendResponse = require('../utils/apiResponse');
const EmailTemplateType = require('../enums/EmailTemplateType');
const { getEmailTemplate } = require('../utils/emailUtils');

// @desc    Get all email template types for a dropdown
// @route   GET /api/v1/email-templates/types
// @access  Private
const getEmailTemplateTypes = asyncHandler(async (req, res) => {
  const templateTypes = Object.keys(EmailTemplateType).map(key => ({
    code: EmailTemplateType[key].code,
    displayName: EmailTemplateType[key].displayName
  }));
  sendResponse(res, 200, 'Email template types retrieved successfully', templateTypes);
});

// @desc    Get all email templates for a tenant
// @route   GET /api/v1/email-templates/:tenantId
// @access  Private
const getEmailTemplates = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const templates = await EmailTemplate.find({ tenantId, isActive: true });

  const emailTemplateTypes = Object.values(EmailTemplateType);

  const templatesWithNames = templates.map(template => {
    const templateType = emailTemplateTypes.find(type => type.code === template.templateId);
    return {
      ...template.toObject(),
      templateTypeName: templateType ? templateType.displayName : ''
    };
  });

  sendResponse(res, 200, 'Email templates retrieved successfully', { templates: templatesWithNames });
});

// @desc    Get a single email template by ID for a tenant
// @route   GET /api/v1/email-templates/:tenantId/:templateId
// @access  Private
const getEmailTemplateById = asyncHandler(async (req, res) => {
  const { tenantId, templateId } = req.params;
  const template = await EmailTemplate.findOne({ _id: templateId, tenantId, isActive: true });

  if (!template) {
    return sendResponse(res, 404, 'Email template not found', null, false);
  }

  sendResponse(res, 200, 'Email template retrieved successfully', template);
});

// @desc    Get a preload email template by type for a tenant (or default if not found)
// @route   GET /api/v1/email-templates/:tenantId/preload/:templateTypeCode
// @access  Private
const getPreloadEmailTemplate = asyncHandler(async (req, res) => {
  const { tenantId, templateTypeCode } = req.params;
  const template = await getEmailTemplate(tenantId, parseInt(templateTypeCode));

  if (!template) {
    return sendResponse(res, 404, 'Preload email template not found', null, false);
  }

  sendResponse(res, 200, 'Preload email template retrieved successfully', template);
});


// @desc    Create a new email template for a tenant
// @route   POST /api/v1/email-templates/:tenantId
// @access  Private
const createEmailTemplate = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
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

// @desc    Update an email template for a tenant
// @route   PUT /api/v1/email-templates/:tenantId/:templateId
// @access  Private
const updateEmailTemplate = asyncHandler(async (req, res) => {
  const { tenantId, templateId } = req.params;

  // Prevent updating tenantId
  if (req.body.tenantId) {
    delete req.body.tenantId;
  }

  const updatedTemplate = await EmailTemplate.findOneAndUpdate(
    { _id: templateId, tenantId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!updatedTemplate) {
    return sendResponse(res, 404, 'Email template not found', null, false);
  }

  sendResponse(res, 200, 'Email template updated successfully', updatedTemplate);
});

// @desc    Delete an email template for a tenant (soft delete)
// @route   DELETE /api/v1/email-templates/:tenantId/:templateId
// @access  Private
const deleteEmailTemplate = asyncHandler(async (req, res) => {
  const { tenantId, templateId } = req.params;

  const template = await EmailTemplate.findOneAndUpdate(
    { _id: templateId, tenantId },
    { isActive: false },
    { new: true }
  );

  if (!template) {
    return sendResponse(res, 404, 'Email template not found', null, false);
  }

  sendResponse(res, 200, 'Email template deleted successfully', {});
});

module.exports = {
  getEmailTemplateTypes,
  getEmailTemplates,
  getEmailTemplateById,
  getPreloadEmailTemplate,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
};
