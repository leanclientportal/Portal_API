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
    unique: false,
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
  profileImageUrl: {
    type: String,
  }
}, {
  timestamps: true,
  collection: 'client'
});

module.exports = mongoose.model('Client', clientSchema);