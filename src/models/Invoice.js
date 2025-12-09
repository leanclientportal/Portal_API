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

module.exports = mongoose.model('Invoice', invoiceSchema);