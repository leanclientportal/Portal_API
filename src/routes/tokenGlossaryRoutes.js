const express = require('express');
const { getTokenGlossary } = require('../controllers/tokenGlossaryController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.route('/').get(protect, getTokenGlossary);

module.exports = router;
