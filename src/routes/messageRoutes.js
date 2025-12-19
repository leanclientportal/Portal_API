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

const router = express.Router();

router.route('/:senderId/:senderType/:receiverId/:receiverType').get(getMessages);
router.route('/conversations/:activeProfileId/:activeProfile').get(getConversations);
router.route('/read-messages/:senderId/:receiverId').post(readMessages);
router.route('/').post(createMessage);

router.route('/:id').get(getMessage).put(updateMessage).delete(deleteMessage);

module.exports = router;
