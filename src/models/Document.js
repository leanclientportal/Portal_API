const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false,
    trim: true
  },
  docUrl: {
    type: String,
    required: true,
    trim: true
  },
  tag: {
    type: String,
    trim: true
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
    type: String,
    enum: ['tenant', 'client']
  },
  uploaderId: {
    type: mongoose.Schema.Types.ObjectId
  }
}, {
  timestamps: false,
  collection: 'document'
});

module.exports = mongoose.model('Document', documentSchema);