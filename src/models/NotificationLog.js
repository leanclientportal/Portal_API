const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['email', 'sms', 'push', 'in-app'],
    required: true
  },
  category: {
    type: String,
    enum: ['project-update', 'task-assigned', 'invoice-sent', 'payment-received', 'deadline-reminder', 'system-alert'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'read'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  metadata: {
    entityType: String, // 'project', 'task', 'invoice', etc.
    entityId: mongoose.Schema.Types.ObjectId,
    actionUrl: String,
    templateId: String,
    variables: mongoose.Schema.Types.Mixed
  },
  delivery: {
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date,
    failureReason: String,
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 3
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'notification_logs'
});

// Indexes for multi-tenant queries
notificationLogSchema.index({ tenantId: 1, recipientId: 1, isActive: 1 });
notificationLogSchema.index({ tenantId: 1, status: 1 });
notificationLogSchema.index({ tenantId: 1, category: 1 });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);