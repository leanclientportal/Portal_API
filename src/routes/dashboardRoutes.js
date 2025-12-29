const express = require('express');
const { dashboardWidgets, dashboardOverview } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/:activeProfileId/:activeProfile', protect, dashboardWidgets);
router.get('/overview/:activeProfileId/:activeProfile', protect, dashboardOverview);

module.exports = router;