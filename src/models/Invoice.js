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
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
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
    type: String,
    required: false
  },
}, {
  timestamps: true,
  collection: 'invoice'
});

// Indexes for multi-tenant queries
invoiceSchema.index({ projectId: 1, isActive: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);