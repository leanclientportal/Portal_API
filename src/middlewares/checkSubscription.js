const { getProjectCount } = require('../services/tokenResolvers/project');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('./asyncHandler');

/**
 * @desc Middleware to check if a user's plan allows access to a specific feature.
 * @param {string} featureId - The ID of the feature to check for.
 */
const checkSubscription = (featureId) => asyncHandler(async (req, res, next) => {
    // protect middleware should run before this, which attaches user to req.
    const user = req.user;

    if (!user) {
        return next(new ErrorResponse('User not found. You must be logged in.', 401));
    }

    if (!user.plan || !user.plan.features) {
        return next(new ErrorResponse('You do not have an active subscription plan.', 403));
    }

    const feature = user.plan.features.find(f => f.id === featureId);


    // Check if the feature exists and its value is not explicitly false.
    if (!feature || feature.value === false) {
        return next(new ErrorResponse('Your current plan does not grant access to this feature. Please upgrade your plan.', 403));
    }
    else {
        var getProjectCount = await getProjectCount(req.params.tenantId);
        if (feature.value < getProjectCount) {
            return next();
        }
        else {
            return next(new ErrorResponse('Your current plan does not access to this feature. Please upgrade your plan.', 403));
        }
    }
    next();
});

module.exports = checkSubscription;
