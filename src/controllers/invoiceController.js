const Invoice = require('../models/Invoice');
const Project = require('../models/Project');
const asyncHandler = require('../middlewares/asyncHandler');
const sendResponse = require('../utils/apiResponse');
const { sendInvoiceUploadEmail, sendInvoicePaidEmail } = require('../utils/emailUtils');
const Client = require('../models/Client');
const Tenant = require('../models/Tenant');

// @desc    Get all invoices for a project
// @route   GET /api/v1/invoices/:projectId
// @access  Private
const getInvoices = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { page = 1, limit = 20, status } = req.query;

  const query = { projectId, isDeleted: false };

  if (status) {
    query.status = status;
  }

  const invoices = await Invoice.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('projectId', 'name');

  const total = await Invoice.countDocuments(query);

  const pagination = {
    current: parseInt(page),
    total: Math.ceil(total / limit),
    count: invoices.length,
    totalRecords: total
  };

  sendResponse(res, 200, 'Invoices retrieved successfully', { invoices }, pagination);
});

// @desc    Create new invoice
// @route   POST /api/v1/invoices/:projectId
// @access  Private
const createInvoice = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { invoiceUrl, title, status, amount, invoiceDate, dueDate, paidDate, paymentLink } = req.body;

  const project = await Project.findById(projectId).populate('clientId');
  if (!project) {
    return sendResponse(res, 404, 'Project not found', null, false);
  }

  const invoice = await Invoice.create({
    projectId,
    invoiceUrl,
    title,
    status,
    amount,
    invoiceDate,
    dueDate,
    paidDate,
    paymentLink
  });

  try {
    const tenant = await Tenant.findById(project.tenantId);
    if (project.clientId && tenant && tenant.emailSetting && tenant.emailSetting.invoiceUpload) {
        const attachments = invoice.invoiceUrl ? [{ path: invoice.invoiceUrl }] : [];
        await sendInvoiceUploadEmail(project.tenantId, project.clientId.email, { number: invoice.title, amount: invoice.amount }, attachments);
    }
  } catch (emailError) {
      console.error(`Failed to send invoice upload email for invoice ${invoice._id}:`, emailError);
  }

  sendResponse(res, 201, 'Invoice created successfully', invoice);
});

// @desc    Update invoice
// @route   PUT /api/v1/invoices/:projectId/:invoiceId
// @access  Private
const updateInvoice = asyncHandler(async (req, res) => {
  const { projectId, invoiceId } = req.params;
  const { invoiceUrl, title, status, amount, invoiceDate, dueDate, paidDate, paymentLink } = req.body;

  const updateFields = {
    invoiceUrl,
    title,
    status,
    amount,
    invoiceDate,
    dueDate,
    paidDate,
    paymentLink
  };

  // Remove undefined fields so they don't overwrite existing data
  Object.keys(updateFields).forEach(key => updateFields[key] === undefined && delete updateFields[key]);

  const invoice = await Invoice.findOneAndUpdate(
    { _id: invoiceId, projectId },
    updateFields,
    {
      new: true,
      runValidators: true
    }
  ).populate([
    { path: 'projectId', select: 'name' }
  ]);

  if (!invoice) {
    return sendResponse(res, 404, 'Invoice not found', null, false);
  }

  sendResponse(res, 200, 'Invoice updated successfully', invoice);
});

// @desc    Delete invoice (soft delete)
// @route   DELETE /api/v1/invoices/:projectId/:invoiceId
// @access  Private
const deleteInvoice = asyncHandler(async (req, res) => {
  const { projectId, invoiceId } = req.params;

  const invoice = await Invoice.findOneAndUpdate(
    { _id: invoiceId, projectId },
    { isDeleted: true },
    { new: true }
  );

  if (!invoice) {
    return sendResponse(res, 404, 'Invoice not found', null, false);
  }

  sendResponse(res, 200, 'Invoice deleted successfully', {});
});

// @desc    Mark invoice as paid
// @route   PUT /api/v1/invoices/:projectId/:invoiceId/pay
// @access  Private
const markAsPaid = asyncHandler(async (req, res) => {
  const { projectId, invoiceId } = req.params;

  const invoice = await Invoice.findOne({ _id: invoiceId, projectId }).populate({ 
      path: 'projectId',
      populate: { path: 'clientId' }
  });

  if (!invoice) {
    return sendResponse(res, 404, 'Invoice not found', null, false);
  }

  if (invoice.status === 'paid') {
    return sendResponse(res, 400, 'Invoice is already paid', null, false);
  }

  invoice.status = 'paid';
  invoice.paidDate = new Date();
  await invoice.save();

  try {
    const tenant = await Tenant.findById(invoice.projectId.tenantId);
    if (invoice.projectId.clientId && tenant && tenant.emailSetting && tenant.emailSetting.invoicePaid) {
        const attachments = invoice.invoiceUrl ? [{ path: invoice.invoiceUrl }] : [];
        await sendInvoicePaidEmail(invoice.projectId.tenantId, invoice.projectId.clientId.email, { number: invoice.title, amount: invoice.amount }, attachments);
    }
  } catch (emailError) {
      console.error(`Failed to send invoice paid email for invoice ${invoice._id}:`, emailError);
  }

  sendResponse(res, 200, 'Invoice marked as paid successfully', invoice);
});


module.exports = {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  markAsPaid
};
