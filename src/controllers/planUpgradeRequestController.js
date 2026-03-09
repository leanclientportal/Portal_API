const PlanUpgradeRequest = require('../models/PlanUpgradeRequest');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Create a new plan upgrade request
// @route   POST /api/plan-upgrade-request
// @access  Private
exports.createPlanUpgradeRequest = asyncHandler(async (req, res, next) => {
  const { userId, requestedPlanId } = req.body;

  const planUpgradeRequest = await PlanUpgradeRequest.create({
    user: userId,
    requestedPlan: requestedPlanId
  });

  res.status(201).json({ success: true, data: planUpgradeRequest });
});