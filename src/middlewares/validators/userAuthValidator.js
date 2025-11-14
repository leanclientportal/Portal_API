const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const sendOtpValidationRules = () => [
  body('email').isEmail().withMessage('Must be a valid email'),
  body('type').isIn(['registration', 'login']).withMessage('Type must be either registration or login'),
];

const verifyOtpValidationRules = () => [
  body('email').isEmail().withMessage('Must be a valid email'),
  body('otp').isString().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 characters long'),
  body('type').isIn(['registration', 'login']).withMessage('Type must be either registration or login'),
  body('name').if(body('type').equals('registration')).notEmpty().withMessage('Name is required for registration'),
  body('phone').optional().isString().isLength({ min: 7, max: 20 }).withMessage('Phone number must be between 7 and 20 characters'),
  body('activeProfile').optional().isIn(['client', 'tenant']).withMessage('activeProfile must be either client or tenant'),
  body('activeProfileId').optional().isMongoId().withMessage('activeProfileId must be a valid Mongo ID'),
];

module.exports = {
  validateRequest,
  sendOtpValidationRules,
  verifyOtpValidationRules,
};
