const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  available: {
    type: Boolean,
    required: true,
  },
  detail: {
    type: String,
  },
}, {_id: false});

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  monthlyPrice: {
    type: String,
    required: true,
  },
  annualPrice: {
    type: String,
    required: true,
  },
  annualSavings: {
    type: String,
    required: true,
  },
  features: [featureSchema],
}, {
  timestamps: true,
  collection: 'plan',
});

module.exports = mongoose.model('Plan', planSchema);
