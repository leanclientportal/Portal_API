const asyncHandler = require('../middlewares/asyncHandler');
const TokenGlossary = require('../models/TokenGlossary');
const APIResponse = require('../utils/apiResponse');

// @desc    Get all token glossary entries
// @route   GET /api/v1/token-glossary
// @access  Private
exports.getTokenGlossary = asyncHandler(async (req, res, next) => {
    const tokenGlossary = await TokenGlossary.find();

    res.status(200).json(new APIResponse(tokenGlossary));
});
