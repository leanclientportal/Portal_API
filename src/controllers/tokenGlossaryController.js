const asyncHandler = require('../middlewares/asyncHandler');
const TokenGlossary = require('../models/TokenGlossary');
const sendResponse = require('../utils/apiResponse');

// @desc    Get all token glossary entries
// @route   GET /api/v1/token-glossary
// @access  Private
exports.getTokenGlossary = asyncHandler(async (req, res, next) => {
    const tokenGlossary = await TokenGlossary.find();

    sendResponse(res, 200, 'Token Glossary retrieved successfully', { tokenGlossary });
});
