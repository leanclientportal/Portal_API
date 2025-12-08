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
    enum: [, 'active', 'on-hold', 'completed'],
    default: 'active'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  lastActivityDate: {
    type: Date,
  }
}, {
  timestamps: true,
  collection: 'project'
});

// Indexes for multi-tenant queries

module.exports = mongoose.model('Project', projectSchema);