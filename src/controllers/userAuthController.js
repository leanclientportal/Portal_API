const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const Tenant = require('../models/Tenant');
const Client = require('../models/Client');
const UserTenantClientMapping = require('../models/UserTenantClientMapping');
const asyncHandler = require('../middlewares/asyncHandler');
const config = require('../config');
const { generateNumericOTP } = require('../utils/otpGenerator');
const { sendEmail } = require('../services/emailService');

const sendOtp = asyncHandler(async (req, res) => {
  const { email, type } = req.body;

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
    { identifier: email, otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    await sendEmail(
      email,
      'Your OTP for Lean Client Portal',
      `Your OTP is: ${otp}`,
      `<p>Your OTP is: <strong>${otp}</strong></p>`
    );
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return res.status(500).json({ message: 'Failed to send OTP email.' });
  }

  res.status(200).json({ message: 'OTP sent to your email. Please verify to continue.' });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp, name, phone, type, activeProfile = 'client' } = req.body;

  if (!email || !otp || !type) {
    return res.status(400).json({ message: 'Email, OTP, and type are required' });
  }

  const otpData = await Otp.findOne({ identifier: email, otp, expiresAt: { $gt: new Date() } });

  if (!otpData) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  let user = await User.findOne({ email });
  let activeProfileId;

  if (type === 'registration' && !user) {
    let profileId;
    if (activeProfile === 'tenant') {
      const newTenant = new Tenant({ companyName: name, email, phone });
      await newTenant.save();
      profileId = newTenant._id;
    } else {
      const newClient = new Client({ name, email, phone });
      await newClient.save();
      profileId = newClient._id;
    }

    const newUser = new User({
      name,
      email,
      phone,
      activeProfile,
      activeProfileId: profileId,
    });
    await newUser.save();
    user = newUser;
    activeProfileId = profileId;

    const newMapping = new UserTenantClientMapping({
      userId: user._id,
      masterId: profileId,
      role: activeProfile
    });
    await newMapping.save();

  } else if (type === 'login' && !user) {
    return res.status(404).json({ message: 'User not found. Please register.' });
  } else {
    activeProfileId = user.activeProfileId;
  }

  if (user) {
    const token = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });

    res.status(200).json({
      success: true,
      message: 'OTP verified and user processed successfully.',
      token,
      userId: user._id,
      activeProfile: user.activeProfile,
      activeProfileId,
    });
  } else {
    return res.status(400).json({ message: "Could not process user." });
  }
});

const createProfile = asyncHandler(async (req, res) => {
  const { name, email, profileType, phone, profileImageUrl } = req.body;
  const { userId } = req.params;

  if (!name || !email || !profileType) {
    return res.status(400).json({ message: 'Name, email, and profileType are required' });
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  let profile;
  if (profileType === 'tenant') {
    profile = new Tenant({ companyName: name, email, phone, profileImageUrl: profileImageUrl });
  } else if (profileType === 'client') {
    profile = new Client({ name, email, phone, profileImageUrl });
  } else {
    return res.status(400).json({ message: "Invalid profileType. Must be 'tenant' or 'client'." });
  }

  await profile.save();

  const newMapping = new UserTenantClientMapping({
    userId: userId,
    masterId: profile._id,
    role: profileType,
  });

  await newMapping.save();

  res.status(201).json({
    success: true,
    message: 'User profile created successfully.',
    data: profile
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { userId, profileId } = req.params;
  const { name, email, phone, profileImageUrl, activeProfile } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const updateFields = {};
  if (name !== undefined) {
    if (activeProfile === 'tenant') {
      updateFields.companyName = name;
    } else {
      updateFields.name = name;
    }
  }
  if (email !== undefined) updateFields.email = email;
  if (phone !== undefined) updateFields.phone = phone;
  if (profileImageUrl !== undefined) {
    updateFields.profileImageUrl = profileImageUrl;
  }

  let profile;
  if (activeProfile === 'tenant') {
    profile = await Tenant.findByIdAndUpdate(profileId, updateFields, {
      new: true,
      runValidators: true,
    });
  } else if (activeProfile === 'client') {
    profile = await Client.findByIdAndUpdate(profileId, updateFields, {
      new: true,
      runValidators: true,
    });
  }

  if (!profile) {
    return res.status(404).json({ success: false, message: 'Profile not found.' });
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: profile,
  });
});

const verifyInvitation = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: 'Invitation token is required' });
  }

  const user = await User.findOne({
    invitationToken: token,
    status: 'pending'
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired invitation token.' });
  }

  user.status = 'active';
  user.invitationToken = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Invitation verified successfully. You can now log in.'
  });
});

const register = asyncHandler(async (req, res) => {
  res.status(400).json({ message: 'Registration is now handled via the /verify-otp endpoint with type registration.' });
});

const login = asyncHandler(async (req, res) => {
  res.status(400).json({ message: 'Login is now handled via the /send-otp and /verify-otp endpoints with type login.' });
});

const logout = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

const switchAccount = asyncHandler(async (req, res) => {
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

const getAccounts = asyncHandler(async (req, res) => {
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
        email: client.email,
        phone: client.phone,
        profileImageUrl: client.profileImageUrl
      };
    } else if (mapping.role === 'tenant') {
      const tenant = await Tenant.findById(mapping.masterId);
      return {
        type: 'tenant',
        id: tenant._id,
        name: tenant.companyName,
        email: tenant.email,
        phone: tenant.phone,
        profileImageUrl: tenant.profileImageUrl
      };
    }
  }));

  res.status(200).json({ accounts });
});

module.exports = {
  sendOtp,
  verifyOtp,
  createProfile,
  updateProfile,
  verifyInvitation,
  register,
  login,
  logout,
  switchAccount,
  getAccounts,
};