const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  invoiceUrl: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  amount: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date,
    required: false
  },
  paymentLink: {
    type: Number,
    required: false
  },
}, {
  timestamps: true,
  collection: 'invoice'
});

// Indexes for multi-tenant queries
invoiceSchema.index({ tenantId: 1, clientId: 1, projectId: 1, isActive: 1 });
invoiceSchema.index({ tenantId: 1, status: 1 });
invoiceSchema.index({ tenantId: 1, invoiceNumber: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);