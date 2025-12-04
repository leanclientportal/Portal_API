const { date } = require('joi');
const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  phone: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profileImageUrl: {
    type: String,
  },
  lastActivityDate: {
    type: Date,
  },
  invitationToken: {
    type: String,
    select: false
  }
}, {
  timestamps: true,
  collection: 'client'
});

module.exports = mongoose.model('Client', clientSchema);