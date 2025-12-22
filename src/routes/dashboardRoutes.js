const express = require('express');
const { dashboardWidgets, dashboardOverview } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/:tenantId', dashboardWidgets);
router.get('/overview/:tenantId', dashboardOverview);

module.exports = router;
