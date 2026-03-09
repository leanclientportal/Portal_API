const User = require('../models/User');
const Plan = require('../models/Plan');
const asyncHandler = require('../middlewares/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all plans
// @route   GET /api/plans
// @access  Public
exports.getPlans = asyncHandler(async (req, res, next) => {
  const plans = await Plan.find();
  res.status(200).json({ success: true, data: { plans });
});

// @desc    Create a new plan
// @route   POST /api/plans
// @access  Public
exports.createPlan = asyncHandler(async (req, res, next) => {
  const plan = await Plan.create(req.body);
  res.status(201).json({ success: true, data: plan });
});

// @desc    Upgrade user plan
// @route   POST /api/plans/upgrade
// @access  Private
exports.upgradePlan = asyncHandler(async (req, res, next) => {
  const { userId, planId } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  const plan = await Plan.findById(planId);

  if (!plan) {
    return next(new ErrorResponse('Plan not found', 404));
  }

  user.plan = plan;
  await user.save();

  res.status(200).json({ success: true, data: user });
});