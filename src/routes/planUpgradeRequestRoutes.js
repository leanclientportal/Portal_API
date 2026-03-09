const express = require('express');
const { createPlanUpgradeRequest } = require('../controllers/planUpgradeRequestController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/', protect, createPlanUpgradeRequest);

module.exports = router;