const { boolean } = require('joi');
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
  docUrl: {
    type: String,
    required: true,
    trim: true
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  isOverwrite : {
    type: Boolean,
    default: false
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