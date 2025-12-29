const express = require('express');
const {
  getChats,
  getChat,
  createChat,
  deleteChat,
} = require('../controllers/chatController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.route('/').get(protect, getChats).post(protect, createChat);

router.route('/:id').get(protect, getChat).delete(protect, deleteChat);

module.exports = router;
