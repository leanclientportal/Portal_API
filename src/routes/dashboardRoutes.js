const express = require('express');
const { dashboardWidgets, dashboardOverview } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/:activeProfileId/:activeProfile', dashboardWidgets);
router.get('/overview/:activeProfileId/:activeProfile', dashboardOverview);

module.exports = router;