const mongoose = require('mongoose');

const planUpgradeRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true,
  collection: 'plan_upgrade_request'
});

module.exports = mongoose.model('PlanUpgradeRequest', planUpgradeRequestSchema);