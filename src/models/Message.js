const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  senderType: {
    type: String,
    enum: ['client', 'tenant'],
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  receiverType: {
    type: String,
    enum: ['client', 'tenant'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
