const Invoice = require('../models/Invoice');
const Project = require('../models/Project');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get all invoices for a project
// @route   GET /api/v1/invoices/:projectId
// @access  Private
const getInvoices = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { page = 1, limit = 20, status } = req.query;

  const query = { projectId };

  if (status) {
    query.status = status;
  }

  const invoices = await Invoice.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('projectId', 'name');

  const total = await Invoice.countDocuments(query);

  res.status(200).json({
    success: true,
    count: invoices.length,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    },
    data: invoices
  });
});

// @desc    Create new invoice
// @route   POST /api/v1/invoices/:projectId
// @access  Private
const createInvoice = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { invoiceUrl, title, status, amount, invoiceDate, dueDate, paidDate, paymentLink } = req.body;

  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
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

  res.status(201).json({
    success: true,
    message: 'Invoice created successfully',
    data: invoice
  });
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
    return res.status(404).json({
      success: false,
      message: 'Invoice not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Invoice updated successfully',
    data: invoice
  });
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
    return res.status(404).json({
      success: false,
      message: 'Invoice not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Invoice deleted successfully',
    data: {}
  });
});

// @desc    Mark invoice as paid
// @route   PUT /api/v1/invoices/:projectId/:invoiceId/pay
// @access  Private
const markAsPaid = asyncHandler(async (req, res) => {
  const { projectId, invoiceId } = req.params;

  const invoice = await Invoice.findOne({ _id: invoiceId, projectId });

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found'
    });
  }

  if (invoice.status === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'Invoice is already paid'
    });
  }

  invoice.status = 'paid';
  invoice.paidDate = new Date();
  await invoice.save();

  res.status(200).json({
    success: true,
    message: 'Invoice marked as paid successfully',
    data: invoice
  });
});


module.exports = {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  markAsPaid
};
