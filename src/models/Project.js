const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
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
  name: {
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
    enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled'],
    default: 'planning'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'project'
});

// Indexes for multi-tenant queries
projectSchema.index({ tenantId: 1, clientId: 1, isActive: 1 });
projectSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('Project', projectSchema);