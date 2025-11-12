const User = require('../models/User');
const Otp = require('../models/Otp');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../middlewares/asyncHandler');
const config = require('../config');

exports.sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const user = await User.findOne({ email });
  if (user) {
    return res.status(400).json({ message: 'A user with this email already exists' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await Otp.findOneAndUpdate({ identifier: email },
    { identifier: email, otp },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`OTP for ${email} is ${otp}`);

  res.status(200).json({ message: 'OTP sent to your email. Please verify to continue.' });
});

exports.verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  const otpData = await Otp.findOne({ identifier: email, otp });

  if (!otpData) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  res.status(200).json({ message: 'OTP verified successfully. You can now complete your registration.' });
});

exports.register = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const newUser = new User({
    email,
    credential: { password }
  });

  await newUser.save();

  res.status(200).json({ message: 'User registered successfully. Please log in.' });
});

exports.login = asyncHandler(async (req, res) => {
  console.log('Login attempt with body:', req.body);
  const { emailOrPhone, password } = req.body;

  if (!emailOrPhone || !password) {
    console.error('Login Error: Missing email/phone or password in request body.');
    return res.status(400).json({ message: 'Email/phone and password are required' });
  }

  const user = await User.findOne({ $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] }).select('+credential.password');
  console.log('User found in DB:', user ? user.toObject() : null);

  if (!user || !user.credential || !user.credential.password) {
    console.error('Login Error: User not found or password not available in database.');
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  console.log('Comparing provided password with stored hash...');
  const isMatch = await bcrypt.compare(password, user.credential.password);
  console.log('Password comparison result:', isMatch);

  if (!isMatch) {
    console.error('Login Error: Password comparison failed.');
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
  console.log('Login successful. Token generated.');

  res.status(200).json({ token, userId: user._id });
});

exports.logout = (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
};