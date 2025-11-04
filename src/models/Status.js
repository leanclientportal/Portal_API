const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['project', 'task', 'invoice', 'client'],
    required: true
  },
  color: {
    type: String,
    required: true,
    trim: true,
    default: '#6B7280' // Default gray color
  },
  order: {
    type: Number,
    default: 0
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  isCancelled: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    trim: true
  },
  permissions: {
    canEdit: {
      type: Boolean,
      default: true
    },
    canDelete: {
      type: Boolean,
      default: true
    },
    restrictedRoles: [String] // Array of roles that can use this status
  },
  automation: {
    autoAssign: {
      enabled: {
        type: Boolean,
        default: false
      },
      conditions: [{
        field: String,
        operator: String, // 'equals', 'contains', 'greater_than', etc.
        value: String
      }]
    },
    notifications: {
      enabled: {
        type: Boolean,
        default: false
      },
      recipients: [String], // Array of roles or user IDs
      template: String
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'status'
});

// Indexes for multi-tenant queries
statusSchema.index({ tenantId: 1, type: 1, isActive: 1 });
statusSchema.index({ tenantId: 1, isDefault: 1 });

// Ensure only one default status per type per tenant
statusSchema.index({ tenantId: 1, type: 1, isDefault: 1 }, {
  unique: true,
  partialFilterExpression: { isDefault: true }
});

module.exports = mongoose.model('Status', statusSchema);