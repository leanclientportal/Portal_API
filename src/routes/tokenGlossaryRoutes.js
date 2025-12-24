const express = require('express');
const { getTokenGlossary } = require('../controllers/tokenGlossaryController');

const router = express.Router();

router.route('/').get(getTokenGlossary);

module.exports = router;
