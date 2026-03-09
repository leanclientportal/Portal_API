const express = require('express');
const { upgradePlan, createPlan, getPlans } = require('../controllers/planController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.route('/').get(getPlans).post(createPlan);
router.post('/upgrade', protect, upgradePlan);

module.exports = router;