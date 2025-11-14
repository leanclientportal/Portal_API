const express = require('express');
const router = express.Router();
const {
  sendOtp,
  verifyOtp,
  logout,
  switchAccount,
  getAccounts
} = require('../controllers/userAuthController');
const { validate, validationSchemas } = require('../middlewares/validation');

// These routes are now open and do not require authentication

// Step 1: Send OTP for registration or login
router.post('/send-otp', validate(validationSchemas.auth.sendOtp), sendOtp);

// Step 2: Verify OTP and handle registration/login
router.post('/verify-otp', validate(validationSchemas.auth.verifyOtp), verifyOtp);

// Logout a user (requires authentication)
const { protect } = require('../middlewares/auth');
router.post('/logout', logout);

// Switch account
router.post('/switch-account/:userId', switchAccount);

// Get all accounts for a user
router.get('/get-accounts/:userId', getAccounts);

module.exports = router;
