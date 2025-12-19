const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  profileImageUrl: {
    type: String,
  },
  lastMessage: {
    type: String,
  },
  lastMessageDate: {
    type: Date,
  },
  unreadCount: {
    type: Number,
    default: 0,
  },
  type: {
    type: String,
    enum: ['client', 'tenant'],
    required: true,
  },
}, {
  timestamps: true,
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
