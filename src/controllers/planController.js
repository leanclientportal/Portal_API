const Plan = require('../models/Plan');
const asyncHandler = require('../middlewares/asyncHandler');
const sendResponse = require('../utils/apiResponse');

// @desc    Get all plans
// @route   GET /api/v1/plans
// @access  Private
const getPlans = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, status, isActive } = req.query;

  // Build query
  const query = {};

  if (type) {
    query.type = type;
  }

  if (status) {
    query.status = status;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  // Execute query with pagination
  const plans = await Plan.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await Plan.countDocuments(query);

  const pagination = {
    current: parseInt(page),
    total: Math.ceil(total / limit),
    count: plans.length,
    totalRecords: total
  };

  sendResponse(res, 200, 'Plans retrieved successfully', { plans }, pagination);
});

// @desc    Get a single plan by ID
// @route   GET /api/v1/plans/:planId
// @access  Private
const getPlanById = asyncHandler(async (req, res) => {
  const { planId } = req.params;

  const plan = await Plan.findById(planId);

  if (!plan) {
    return sendResponse(res, 404, 'Plan not found', null, false);
  }

  sendResponse(res, 200, 'Plan retrieved successfully', plan);
});

// @desc    Create new plan
// @route   POST /api/v1/plans
// @access  Private
const createPlan = asyncHandler(async (req, res) => {
  const plan = await Plan.create(req.body);

  sendResponse(res, 201, 'Plan created successfully', plan);
});

// @desc    Update plan
// @route   PUT /api/v1/plans/:planId
// @access  Private
const updatePlan = asyncHandler(async (req, res) => {
  const { planId } = req.params;

  const plan = await Plan.findByIdAndUpdate(
    planId,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  if (!plan) {
    return sendResponse(res, 404, 'Plan not found', null, false);
  }

  sendResponse(res, 200, 'Plan updated successfully', plan);
});

// @desc    Delete plan (soft delete)
// @route   DELETE /api/v1/plans/:planId
// @access  Private
const deletePlan = asyncHandler(async (req, res) => {
  const { planId } = req.params;

  const plan = await Plan.findByIdAndUpdate(
    planId,
    { isActive: false },
    { new: true }
  );

  if (!plan) {
    return sendResponse(res, 404, 'Plan not found', null, false);
  }

  sendResponse(res, 200, 'Plan deleted successfully', {});
});

module.exports = {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
};
