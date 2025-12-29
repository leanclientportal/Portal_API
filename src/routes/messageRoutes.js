const express = require('express');
const {
  getMessages,
  getConversations,
  getMessage,
  createMessage,
  updateMessage,
  deleteMessage,
  readMessages
} = require('../controllers/messageController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.route('/:senderId/:senderType/:receiverId/:receiverType').get(protect, getMessages);
router.route('/conversations/:activeProfileId/:activeProfile').get(protect, getConversations);
router.route('/read-messages/:senderId/:receiverId').post(protect, readMessages);
router.route('/').post(protect, createMessage);

router.route('/:id').get(protect, getMessage).put(protect, updateMessage).delete(protect, deleteMessage);

module.exports = router;
