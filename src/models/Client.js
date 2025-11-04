const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profileUrl: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true,
  collection: 'client'
});

// Indexes for common multi-tenant queries and uniqueness per tenant
clientSchema.index({ tenantId: 1, isActive: 1 });
clientSchema.index({ tenantId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Client', clientSchema);
