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
    unique: false,
    lowercase: true,
  },
  phone: {
    type: String,
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
  profileImageUrl: {
    type: String
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan'
  },
  smtpSetting: {
    user: {
        type: String
    },
    pass: {
        type: String
    },
    service: {
        type: String
    },
    from: {
        type: String
    }
  },
  emailSetting: {
    newProject: {
        type: Boolean,
        default: true
    },
    projectStatusChange: {
        type: Boolean,
        default: true
    },
    newTask: {
        type: Boolean,
        default: true
    },
    taskUpdate: {
        type: Boolean,
        default: true
    },
    documentUpload: {
        type: Boolean,
        default: true
    },
    invoiceUpload: {
        type: Boolean,
        default: true
    }
  }
}, {
  timestamps: true,
  collection: 'tenant'
});

module.exports = mongoose.model('Tenant', tenantSchema);