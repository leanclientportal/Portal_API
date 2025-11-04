const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  invoiceNumber: {
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
  items: [{
    description: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    rate: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    taxable: {
      type: Boolean,
      default: true
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  tax: {
    rate: {
      type: Number,
      default: 0
    },
    amount: {
      type: Number,
      default: 0
    }
  },
  discount: {
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    value: {
      type: Number,
      default: 0
    },
    amount: {
      type: Number,
      default: 0
    }
  },
  total: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  dates: {
    issued: {
      type: Date,
      default: Date.now
    },
    due: Date,
    sent: Date,
    paid: Date
  },
  billingAddress: {
    name: String,
    company: String,
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['bank-transfer', 'credit-card', 'paypal', 'stripe', 'cash', 'other'],
      default: 'bank-transfer'
    },
    reference: String,
    notes: String
  },
  notes: {
    type: String,
    trim: true
  },
  terms: {
    type: String,
    trim: true
  },
  attachments: [{
    filename: String,
    originalName: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
      default: 'monthly'
    },
    nextDate: Date,
    endDate: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'invoice'
});

// Indexes for multi-tenant queries
invoiceSchema.index({ tenantId: 1, clientId: 1, projectId: 1, isActive: 1 });
invoiceSchema.index({ tenantId: 1, status: 1 });
invoiceSchema.index({ tenantId: 1, invoiceNumber: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);