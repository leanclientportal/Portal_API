const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const Tenant = require('../models/Tenant');
const Client = require('../models/Client');
const Project = require('../models/Project');
const UserTenantClientMapping = require('../models/UserTenantClientMapping');
const TenantClientMapping = require('../models/TenantClientMapping');
const EmailTemplate = require('../models/EmailTemplate');
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
    let tenantId = null;
    if (user && user.activeProfile === 'tenant') {
      tenantId = user.activeProfileId;
    } else if (user && user.activeProfile === 'client') {
      const mapping = await TenantClientMapping.findOne({ clientId: user.activeProfileId });
      if (mapping) {
        tenantId = mapping.tenantId;
      }
    }

    if (user && user.activeProfile === 'client') {
      let client = Client.findById(user.activeProfileId);
      if (client) {
        if (client.invitationToken)
          return res.status(404).json({
            message: 'Invitation not accepted. Please check your email and accept the invitation to continue.'
          });

        if (!client.isActive)
          return res.status(404).json({
            message: 'Account not activated. Please verify your email to activate your account.'
          });
      }
      else
        return res.status(404).json({ message: 'User not found. Please register.' });
    }


    let emailTemplate;
    if (tenantId) {
      emailTemplate = await EmailTemplate.findOne({ tenantId, templateId: config.Invitation_Email_Temaplate_Id, isActive: true });
    }

    if (!emailTemplate) {
      emailTemplate = await EmailTemplate.findOne({ tenantId: null, templateId: config.Invitation_Email_Temaplate_Id, isActive: true });
    }

    let subject;
    let html;
    let text;

    if (emailTemplate) {
      subject = emailTemplate.subject;
      html = emailTemplate.body.replace(/{{otp}}/g, otp);
      text = html.replace(/<[^>]*>?/gm, '');
    } else {
      console.warn(`Warning: 'otp' email template not found. Using default email content.`);
      subject = 'Your OTP for Lean Client Portal';
      text = `Your OTP is: ${otp}`;
      html = `<p>Your OTP is: <strong>${otp}</strong></p>`;
    }

    await sendEmail(email, subject, text, html);

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
  let activeProfileImage;
  let profileName;

  if (type === 'registration' && !user) {
    let profileId;
    if (activeProfile === 'tenant') {
      const newTenant = new Tenant({ companyName: name, email, phone });
      await newTenant.save();
      profileId = newTenant._id;
      activeProfileImage = newTenant.profileImageUrl;
      profileName = newTenant.companyName;
    } else {
      const newClient = new Client({ name, email, phone });
      await newClient.save();
      profileId = newClient._id;
      activeProfileImage = newClient.profileImageUrl;
      profileName = newClient.name;
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
  } else if (user) {
    activeProfileId = user.activeProfileId;
    if (user.activeProfile === 'tenant') {
      const tenant = await Tenant.findById(activeProfileId);
      if (tenant) {
        activeProfileImage = tenant.profileImageUrl;
        profileName = tenant.companyName;
      }
    } else if (user.activeProfile === 'client') {
      const client = await Client.findById(activeProfileId);
      if (client) {
        activeProfileImage = client.profileImageUrl;
        profileName = client.name;
      }
    }
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
      activeProfileImage,
      profileName
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
  const { name, email, phone, profileImageUrl, profileType } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const updateFields = {};
  if (name !== undefined) {
    if (profileType === 'tenant') {
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
  if (profileType === 'tenant') {
    profile = await Tenant.findByIdAndUpdate(profileId, updateFields, {
      new: true,
      runValidators: true,
    });
  } else if (profileType === 'client') {
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

const mergeProfiles = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { sourceProfileId, targetProfileId, profileType } = req.body;

  if (!sourceProfileId || !targetProfileId || !profileType) {
    return res.status(400).json({ success: false, message: 'Source profile ID, target profile ID, and profile type are required.' });
  }

  if (sourceProfileId === targetProfileId) {
    return res.status(400).json({ success: false, message: 'Source and target profile IDs cannot be the same.' });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const targetMapping = await UserTenantClientMapping.findOne({ userId, masterId: targetProfileId, role: profileType });

  if (!targetMapping) {
    return res.status(404).json({ success: false, message: 'One or both profiles do not belong to the specified user or do not exist.' });
  }

  if (profileType === 'tenant') {
    await TenantClientMapping.updateMany({ tenantId: targetProfileId }, { $set: { tenantId: sourceProfileId } });
    await Project.updateMany({ tenantId: targetProfileId }, { $set: { tenantId: sourceProfileId } });
    // await Tenant.findByIdAndDelete(sourceProfileId);
  } else if (profileType === 'client') {
    await TenantClientMapping.updateMany({ clientId: targetProfileId }, { $set: { clientId: sourceProfileId } });
    await Project.updateMany({ clientId: targetProfileId }, { $set: { clientId: sourceProfileId } });
    // await Client.findByIdAndDelete(sourceProfileId);
  }

  await UserTenantClientMapping.findByIdAndDelete(targetMapping._id);

  res.status(200).json({ success: true, message: `Successfully merged profile ${sourceProfileId} into profile ${targetProfileId}.` });
});

const verifyInvitation = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: 'Invitation token is required' });
  }

  const client = await Client.findOne({
    invitationToken: token,
    status: 'pending'
  });

  if (!client) {
    return res.status(400).json({ message: 'Invalid or expired invitation token.' });
  }

  client.isActive = 'active';
  user.invitationToken = null;
  await client.save();

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
  let activeProfileImage;
  let profileName;
  if (activeProfile === 'tenant') {
    const tenant = await Tenant.findById(masterId);
    if (tenant) {
      activeProfileImage = tenant.profileImageUrl;
      profileName = tenant.companyName;
    }
  } else if (activeProfile === 'client') {
    const client = await Client.findById(masterId);
    if (client) {
      activeProfileImage = client.profileImageUrl;
      profileName = client.name;
    }
  }

  const token = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });

  res.status(200).json({
    success: true,
    message: 'Profile switch successfully.',
    token,
    userId: user._id,
    activeProfile: user.activeProfile,
    activeProfileId: user.activeProfileId,
    activeProfileImage,
    profileName
  });
});

const getAccounts = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const mappings = await UserTenantClientMapping.find({ userId });

  if (!mappings || mappings.length === 0) {
    return res.status(404).json({ message: 'No accounts found for this user.' });
  }

  const accounts = await Promise.all(mappings.map(async (mapping) => {
    let profile = null;
    if (mapping.role === 'client') {
      profile = await Client.findById(mapping.masterId);
      if (profile) {
        return {
          type: 'client',
          id: profile._id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          profileImageUrl: profile.profileImageUrl
        };
      }
    } else if (mapping.role === 'tenant') {
      profile = await Tenant.findById(mapping.masterId);
      if (profile) {
        return {
          type: 'tenant',
          id: profile._id,
          name: profile.companyName,
          email: profile.email,
          phone: profile.phone,
          profileImageUrl: profile.profileImageUrl
        };
      }
    }
    return null;
  }));

  const validAccounts = accounts.filter(account => account !== null);

  res.status(200).json({ accounts: validAccounts });
});

module.exports = {
  sendOtp,
  verifyOtp,
  createProfile,
  updateProfile,
  mergeProfiles,
  verifyInvitation,
  register,
  login,
  logout,
  switchAccount,
  getAccounts,
};