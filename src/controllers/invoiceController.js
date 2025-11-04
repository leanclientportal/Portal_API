const Invoice = require('../models/Invoice');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Get all invoices for a project
// @route   GET /api/v1/invoices/:tenantId/:clientId/:projectId
// @access  Private
const getInvoices = asyncHandler(async (req, res) => {
  const { tenantId, clientId, projectId } = req.params;
  const { page = 1, limit = 20, search, status } = req.query;

  // Build query
  const query = { tenantId, clientId, projectId, isActive: true };
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { invoiceNumber: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (status) {
    query.status = status;
  }

  // Execute query with pagination
  const invoices = await Invoice.find(query)
    .populate('projectId', 'name')
    .populate('clientId', 'name company email')
    .select('-__v')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Invoice.countDocuments(query);

  res.status(200).json({
    success: true,
    message: 'Invoices retrieved successfully',
    data: {
      invoices,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: invoices.length,
        totalRecords: total
      }
    }
  });
});

// @desc    Create new invoice
// @route   POST /api/v1/invoices/:tenantId/:clientId/:projectId
// @access  Private
const createInvoice = asyncHandler(async (req, res) => {
  const { tenantId, clientId, projectId } = req.params;

  // Calculate totals
  let subtotal = 0;
  if (req.body.items && req.body.items.length > 0) {
    subtotal = req.body.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  }

  const taxAmount = req.body.tax ? (subtotal * (req.body.tax.rate || 0)) / 100 : 0;
  const discountAmount = req.body.discount ? 
    (req.body.discount.type === 'percentage' ? 
      (subtotal * (req.body.discount.value || 0)) / 100 : 
      req.body.discount.value || 0) : 0;
  const total = subtotal + taxAmount - discountAmount;

  // Generate invoice number
  const invoiceCount = await Invoice.countDocuments({ tenantId });
  const invoiceNumber = `INV-${Date.now()}-${(invoiceCount + 1).toString().padStart(4, '0')}`;

  const invoice = await Invoice.create({
    ...req.body,
    tenantId,
    clientId,
    projectId,
    invoiceNumber,
    subtotal,
    tax: {
      ...req.body.tax,
      amount: taxAmount
    },
    discount: {
      ...req.body.discount,
      amount: discountAmount
    },
    total
  });

  await invoice.populate([
    { path: 'projectId', select: 'name' },
    { path: 'clientId', select: 'name company email' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Invoice created successfully',
    data: invoice
  });
});

// @desc    Update invoice
// @route   PUT /api/v1/invoices/:tenantId/:clientId/:projectId/:invoiceId
// @access  Private
const updateInvoice = asyncHandler(async (req, res) => {
  const { tenantId, clientId, projectId, invoiceId } = req.params;

  // Recalculate totals if items are updated
  if (req.body.items) {
    const subtotal = req.body.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxAmount = req.body.tax ? (subtotal * (req.body.tax.rate || 0)) / 100 : 0;
    const discountAmount = req.body.discount ? 
      (req.body.discount.type === 'percentage' ? 
        (subtotal * (req.body.discount.value || 0)) / 100 : 
        req.body.discount.value || 0) : 0;
    const total = subtotal + taxAmount - discountAmount;

    req.body.subtotal = subtotal;
    req.body.tax = {
      ...req.body.tax,
      amount: taxAmount
    };
    req.body.discount = {
      ...req.body.discount,
      amount: discountAmount
    };
    req.body.total = total;
  }

  const invoice = await Invoice.findOneAndUpdate(
    { _id: invoiceId, tenantId, clientId, projectId },
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate([
    { path: 'projectId', select: 'name' },
    { path: 'clientId', select: 'name company email' }
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
// @route   DELETE /api/v1/invoices/:tenantId/:clientId/:projectId/:invoiceId
// @access  Private
const deleteInvoice = asyncHandler(async (req, res) => {
  const { tenantId, clientId, projectId, invoiceId } = req.params;

  const invoice = await Invoice.findOneAndUpdate(
    { _id: invoiceId, tenantId, clientId, projectId },
    { isActive: false },
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
    message: 'Invoice deleted successfully'
  });
});

module.exports = {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice
};