const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
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
  url: {
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
    enum: ['admin', 'client']
  },
  uploaderId: {
    type: mongoose.Schema.Types.ObjectId
  }
}, {
  timestamps: false,
  collection: 'document'
});

module.exports = mongoose.model('Document', documentSchema);