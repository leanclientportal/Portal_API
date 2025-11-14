const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const asyncHandler = require('../middlewares/asyncHandler');
const config = require('../config');
const { generateNumericOTP } = require('../utils/otpGenerator');

exports.sendOtp = asyncHandler(async (req, res) => {
  const { email, type } = req.body; // Added 'type'

  if (!email || !type) {
    return res.status(400).json({ message: 'Email and type are required' });
  }

  const user = await User.findOne({ email });

  if (type === 'registration' && user) {
    return res.status(400).json({ message: 'User already registered. Please login.' });
  } else if (type === 'login' && !user) {
    return res.status(404).json({ message: 'User not found. Please register.' });
  }

  const otp = generateNumericOTP(6);
  await Otp.findOneAndUpdate(
    { identifier: email },
    { identifier: email, otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) }, // OTP valid for 10 minutes
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`OTP for ${email} is ${otp}`);
  res.status(200).json({ message: 'OTP sent to your email. Please verify to continue.' });
});

exports.verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp, name, phone, type, activeProfile = 'client' } = req.body; // Added 'type'

  if (!email || !otp || !type) {
    return res.status(400).json({ message: 'Email, OTP, and type are required' });
  }

  const otpData = await Otp.findOne({ identifier: email, otp, expiresAt: { $gt: new Date() } });

  if (!otpData) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  let user = await User.findOne({ email });
  let masterId;
  
  if (type === 'registration' && !user) {
    // Create a new user only during registration
    const masterUser = new User({
        name,
        email,
        phone,
        profiles: [{
            profileType: activeProfile,
            isActive: true
        }],
        activeProfile: activeProfile,
    });
    await masterUser.save();
    user = masterUser;
    masterId = masterUser._id;

  } else if (type === 'login' && !user) {
    return res.status(404).json({ message: 'User not found. Please register.' });
  }
  
  // If user exists or was just created, proceed to generate token
  if(user) {
    // Generate JWT token
    const token = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
  
    res.status(200).json({
      success: true,
      message: 'OTP verified and user processed successfully.',
      token,
      userId: user._id,
      activeProfile: user.activeProfile,
      activeProfileId: user.activeProfileId,
    });
  } else {
    // This case should ideally not be reached if logic is correct
    return res.status(400).json({message: "Could not process user."})
  }
});

exports.register = asyncHandler(async (req, res) => {
  res.status(400).json({ message: 'Registration is now handled via the /verify-otp endpoint with type registration.' });
});

exports.login = asyncHandler(async (req, res) => {
  res.status(400).json({ message: 'Login is now handled via the /send-otp and /verify-otp endpoints with type login.' });
});

exports.logout = asyncHandler(async (req, res) => {
  // For JWT, logout is typically handled client-side by deleting the token.
  // This endpoint is here to provide a standard RESTful logout flow.
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

exports.switchAccount = asyncHandler(async (req, res) => {
  const { activeProfile, masterId } = req.body;
  const { userId } = req.params;

  if (!activeProfile || !masterId) {
    return res.status(400).json({ message: 'activeProfile and masterId are required' });
  }

  const mapping = await UserTenantClientMapping.findOne({
    userId,
    masterId,
    role: activeProfile
  });

  if (!mapping) {
    return res.status(404).json({ message: 'No account found for the provided details.' });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  user.activeProfile = activeProfile;
  user.activeProfileId = masterId;
  user.lastActiveDate = new Date();
  await user.save();

  const token = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });

  res.status(200).json({ token, userId: user._id, activeProfile: user.activeProfile, activeProfileId: user.activeProfileId });
});


exports.getAccounts = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const mappings = await UserTenantClientMapping.find({ userId });

  if (!mappings || mappings.length === 0) {
    return res.status(404).json({ message: 'No accounts found for this user.' });
  }

  const accounts = await Promise.all(mappings.map(async (mapping) => {
    if (mapping.role === 'client') {
      const client = await Client.findById(mapping.masterId);
      return {
        type: 'client',
        id: client._id,
        name: client.name,
        email: client.email
      };
    } else if (mapping.role === 'tenant') {
      const tenant = await Tenant.findById(mapping.masterId);
      return {
        type: 'tenant',
        id: tenant._id,
        name: tenant.companyName,
        email: tenant.email
      };
    }
  }));

  res.status(200).json({ accounts });
});
