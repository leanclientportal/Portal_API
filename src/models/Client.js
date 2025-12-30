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
  },
  generalSetting: {
    currency: {
      type: String,
      default: 'usd'
    },
    dateFormat: {
      type: String,
       default: 'dd/MM/yyyy'
    },
    amountFormat: {
      type: String,
      default: '0,0.00'
    },
    logoUrl: {
      type: String
    }
  }
}, {
  timestamps: true,
  collection: 'client'
});

module.exports = mongoose.model('Client', clientSchema);