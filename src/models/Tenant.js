const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 200
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  phone: {
    type: String,
    minlength: 7,
    maxlength: 20
  },
  isActive: {
    type: Boolean,
    default: true
  },
  brandColor: {
    type: String
  },
  customDomain: {
    type: String
  },
  logoUrl: {
    type: String
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan'
  },
}, {
  timestamps: true,
  collection: 'tenant'
});

module.exports = mongoose.model('Tenant', tenantSchema);