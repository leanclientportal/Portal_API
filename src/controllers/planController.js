const Plan = require('../models/Plan');
const asyncHandler = require('../middlewares/asyncHandler');

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
    .select('-__v')
    .sort({ priority: -1, createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await Plan.countDocuments(query);

  res.status(200).json({
    success: true,
    message: 'Plans retrieved successfully',
    data: {
      plans,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: plans.length,
        totalRecords: total
      }
    }
  });
});

// @desc    Get a single plan by ID
// @route   GET /api/v1/plans/:planId
// @access  Private
const getPlanById = asyncHandler(async (req, res) => {
  const { planId } = req.params;

  const plan = await Plan.findById(planId).select('-__v');

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'Plan not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Plan retrieved successfully',
    data: plan
  });
});

// @desc    Create new plan
// @route   POST /api/v1/plans
// @access  Private
const createPlan = asyncHandler(async (req, res) => {
  const plan = await Plan.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Plan created successfully',
    data: plan
  });
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
    return res.status(404).json({
      success: false,
      message: 'Plan not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Plan updated successfully',
    data: plan
  });
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
    return res.status(404).json({
      success: false,
      message: 'Plan not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Plan deleted successfully'
  });
});

module.exports = {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
};

