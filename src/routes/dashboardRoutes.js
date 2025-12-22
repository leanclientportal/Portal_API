const express = require('express');
const { dashboardWidgets } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/:tenantId', protect, dashboardWidgets);

module.exports = router;
