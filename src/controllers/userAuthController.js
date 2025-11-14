const User = require('../models/User');
const Otp = require('../models/Otp');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../middlewares/asyncHandler');
const config = require('../config');
const Client = require('../models/Client');
const Tenant = require('../models/Tenant');
const UserTenantClientMapping = require('../models/UserTenantClientMapping');

exports.sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // Allow sending OTP even if user exists for login/password reset flows
  // const user = await User.findOne({ email });
  // if (user) {
  //   return res.status(400).json({ message: 'A user with this email already exists' });
  // }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await Otp.findOneAndUpdate({ identifier: email },
    { identifier: email, otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) }, // OTP valid for 10 minutes
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`OTP for ${email} is ${otp}`);

  res.status(200).json({ message: 'OTP sent to your email. Please verify to continue.' });
});

exports.verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp, name, phone, activeProfile = 'client' } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  const otpData = await Otp.findOne({ identifier: email, otp, expiresAt: { $gt: new Date() } });

  if (!otpData) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  // OTP is verified, delete it
  await Otp.deleteOne({ _id: otpData._id });

  let user = await User.findOne({ email });
  let masterId;

  if (!user) {
    // User does not exist, proceed with registration
    if (!name) {
        return res.status(400).json({ message: 'Name is required for new user registration' });
    }

    if (activeProfile === 'client') {
      let client = await Client.findOne({ email });
      if (!client) {
        client = new Client({ name, email, phone });
        await client.save();
      }
      masterId = client._id;
    } else if (activeProfile === 'tenant') {
      let tenant = await Tenant.findOne({ email });
      if (!tenant) {
        tenant = new Tenant({ companyName: name, email, phone });
        await tenant.save();
      }
      masterId = tenant._id;
    } else {
      return res.status(400).json({ message: 'Invalid active profile provided' });
    }

    user = new User({
      email,
      name,
      phone,
      activeProfile,
      activeProfileId: masterId,
    });
    await user.save();

    const newMapping = new UserTenantClientMapping({
      userId: user._id,
      masterId,
      role: activeProfile,
    });
    await newMapping.save();

  } else {
    // User exists, check if activeProfile and activeProfileId are consistent
    // If user exists, we assume this is a login attempt or they are re-verifying.
    // We don't create new client/tenant or user entries here if they already exist.
    // We should ensure a mapping exists for the current activeProfile and activeProfileId if provided.
    let mapping = await UserTenantClientMapping.findOne({ userId: user._id, masterId: user.activeProfileId, role: user.activeProfile });
    if (!mapping) {
        // This scenario might happen if a user has an account but no mapping for their active profile.
        // For now, we'll log it and proceed, but a more robust solution might require user intervention.
        console.warn(`User ${user.email} has no mapping for activeProfile: ${user.activeProfile}, activeProfileId: ${user.activeProfileId}`);
    }
  }

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
});

exports.register = asyncHandler(async (req, res) => {
  // This endpoint is now redundant. Registration happens via verifyOtp.
  res.status(400).json({ message: 'Registration is now handled via the /verify-otp endpoint.' });
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

  const mapping = await UserTenantClientMapping.findOne({
    userId: user._id,
    masterId: user.activeProfileId,
    role: user.activeProfile
  });

  if (!mapping) {
    return res.status(400).json({ message: 'User mapping not found. Please contact support.' });
  }

  user.lastActiveDate = new Date();
  await user.save();

  const token = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
  console.log('Login successful. Token generated.');

  res.status(200).json({ token, userId: user._id, activeProfile: user.activeProfile, activeProfileId: user.activeProfileId });
});

exports.logout = (req, res) => {
  res.status(200).json({ message: 'Logged out successfully' });
};


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