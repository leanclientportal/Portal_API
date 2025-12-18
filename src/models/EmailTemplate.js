const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  templateId: {
    type: Number,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String, // Can be HTML
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'email_template'
});

// A templateId should be unique for a given tenant.
emailTemplateSchema.index({ tenantId: 1, templateId: 1 }, { unique: true });

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
