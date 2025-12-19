const express = require('express');
const {
  getChats,
  getChat,
  createChat,
  deleteChat,
} = require('../controllers/chatController');

const router = express.Router();

router.route('/').get(getChats).post(createChat);

router.route('/:id').get(getChat).delete(deleteChat);

module.exports = router;
