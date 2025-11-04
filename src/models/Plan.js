const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  pricing: {
    monthly: {
      type: Number,
      required: true
    },
    yearly: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  features: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    included: {
      type: Boolean,
      default: true
    },
    limit: Number // For quantitative features like "5 projects"
  }],
  limits: {
    clients: {
      type: Number,
      default: -1 // -1 means unlimited
    },
    projects: {
      type: Number,
      default: -1
    },
    users: {
      type: Number,
      default: -1
    },
    storage: {
      type: Number,
      default: -1 // in GB
    },
    monthlyInvoices: {
      type: Number,
      default: -1
    }
  },
  type: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deprecated'],
    default: 'active'
  },
  trial: {
    duration: {
      type: Number,
      default: 0 // days
    },
    features: [String] // Array of feature names available in trial
  },
  priority: {
    type: Number,
    default: 0 // For ordering in UI
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'plan'
});

// Indexes
planSchema.index({ status: 1, isActive: 1 });
planSchema.index({ type: 1 });

module.exports = mongoose.model('Plan', planSchema);