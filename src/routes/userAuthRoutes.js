const express = require('express');
const router = express.Router();
const {
  sendOtp,
  verifyOtp,
  register,
  login,
  logout,
  switchAccount,
  getAccounts
} = require('../controllers/userAuthController');
const {
  validateRequest,
  sendOtpValidationRules,
  verifyOtpValidationRules,
} = require('../middlewares/validators/userAuthValidator');

// These routes are now open and do not require authentication

// Step 1: Send OTP for registration or login
router.post('/send-otp', sendOtpValidationRules(), validateRequest, sendOtp);

// Step 2: Verify OTP
router.post('/verify-otp', verifyOtpValidationRules(), validateRequest, verifyOtp);

// Step 3: Register a new user after OTP verification
// This route is now effectively deprecated and handled by /verify-otp
router.post('/register', register);

// Login a user
// This route is now effectively deprecated and handled by /verify-otp
router.post('/login', login);

// Logout a user (requires authentication)
const { protect } = require('../middlewares/auth');
router.post('/logout', logout);

// Switch account
router.post('/switch-account/:userId', switchAccount);

// Get all accounts for a user
router.get('/get-accounts/:userId', getAccounts);

module.exports = router;
