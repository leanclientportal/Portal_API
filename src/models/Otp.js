const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    unique: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30m', // OTP expires in 30 minutes
  }
}, {
  timestamps: true,
  collection: 'otp'
});

module.exports = mongoose.model('Otp', otpSchema);