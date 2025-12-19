const express = require('express');
const {
  getMessages,
  getMessage,
  createMessage,
  updateMessage,
  deleteMessage,
} = require('../controllers/messageController');

const router = express.Router();

router.route('/:senderId/:senderType/:receiverId/:receiverType').get(getMessages);
router.route('/').post(createMessage);

router.route('/:id').get(getMessage).put(updateMessage).delete(deleteMessage);

module.exports = router;
