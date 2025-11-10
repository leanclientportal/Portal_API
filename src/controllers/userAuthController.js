const User = require('../models/User');
const Otp = require('../models/Otp');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../middlewares/asyncHandler');
const config = require('../config');
// const nodemailer = require('nodemailer');
// const twilio = require('twilio'); // Commented out for now

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: config.GMAIL_USER,
//     pass: config.GMAIL_PASS
//   }
// });

/* // Commenting out Twilio for now
const twilioClient = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
*/

// const sendOtpEmail = async (email, otp) => {
//   const mailOptions = {
//     from: config.GMAIL_USER,
//     to: email,
//     subject: 'Your OTP for registration',
//     text: `Your OTP is: ${otp}`
//   };
//   await transporter.sendMail(mailOptions);
// };

/* // Commenting out SMS sending for now
const sendOtpSms = async (phone, otp) => {
  await twilioClient.messages.create({
    body: `Your OTP is: ${otp}`,
    from: config.TWILIO_PHONE_NUMBER,
    to: phone
  });
};
*/

// Step 1: Send OTP to user's email
exports.sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Basic validation
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const user = await User.findOne({ email });
  if (user) {
    return res.status(400).json({ message: 'A user with this email already exists' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP for the email
  await Otp.findOneAndUpdate({ identifier: email }, { identifier: email, otp }, { upsert: true, new: true, setDefaultsOnInsert: true });

  // In a real application, you would uncomment this line
  // await sendOtpEmail(email, otp);
  console.log(`OTP for ${email} is ${otp}`); // For debugging during development

  res.status(200).json({ message: 'OTP sent to your email. Please verify to continue.' });
});

// Step 2: Verify the OTP sent to the email
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


// Step 3: Complete registration after OTP verification
exports.register = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user already exists (edge case)
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const newUser = new User({
    email,
    credential: { password }
  });

  await newUser.save();

  // Clean up the OTP from the database
  await Otp.deleteOne({ identifier: email, otp });

  res.status(200).json({ message: 'User registered successfully. Please log in.' });
});


// --- Existing Login and Logout Functions ---

exports.login = asyncHandler(async (req, res) => {
  const { login, password } = req.body;

  const user = await User.findOne({ $or: [{ email: login }, { phone: login }] }).select('+credential');

  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.credential.password);

  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });

  res.status(200).json({ token, userId: user._id });
});

exports.logout = (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
};