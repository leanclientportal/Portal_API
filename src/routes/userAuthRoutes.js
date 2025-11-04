const express = require('express');
const router = express.Router();
const {
  sendOtp,
  verifyOtp,
  register,
  login,
  logout
} = require('../controllers/userAuthController');
const { validate } = require('../middlewares/validation');
const { body } = require('express-validator');

// Step 1: Send OTP for registration
router.post('/send-otp',
  [
    body('email').isEmail().withMessage('Enter a valid email'),
  ],
  validate,
  sendOtp
);

// Step 2: Verify OTP
router.post('/verify-otp',
    [
        body('email').isEmail().withMessage('Enter a valid email'),
        body('otp').isLength({ min: 6, max: 6 }).withMessage('Enter a valid 6-digit OTP'),
    ],
    validate,
    verifyOtp
);

// Step 3: Register a new user after OTP verification
router.post('/register',
  [
    body('email').isEmail().withMessage('Enter a valid email'),
    body('phone').isString().optional(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  validate,
  register
);

// Login a user
router.post('/login',
  [
    body('login').notEmpty().withMessage('Enter email or phone number'),
    body('password').notEmpty().withMessage('Enter password'),
  ],
  validate,
  login
);

// Logout a user
router.post('/logout', logout);

module.exports = router;