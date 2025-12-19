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
// const { sendEmail } = require('../services/emailService'); // No longer needed directly
const { sendLoginOtpEmail } = require('../utils/emailUtils');
const sendResponse = require('../utils/apiResponse');

const sendOtp = asyncHandler(async (req, res) => {
  const { email, type } = req.body;

  if (!email || !type) {
    return sendResponse(res, 400, 'Email and type are required', null, false);
  }

  const user = await User.findOne({ email });

  if (type === 'registration' && user) {
    return sendResponse(res, 400, 'User already registered. Please login.', null, false);
  } else if (type === 'login' && !user) {
    return sendResponse(res, 404, 'User not found. Please register.', null, false);
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
          return sendResponse(res, 404, 'Invitation not accepted. Please check your email and accept the invitation to continue.', null, false);

        if (client.isActive === false)
          return sendResponse(res, 404, 'Account not activated. Please verify your email to activate your account.', null, false);
      }
      else
        return sendResponse(res, 404, 'User not found. Please register.', null, false);
    }

    // Use the utility function to send the OTP email
    await sendLoginOtpEmail(tenantId, email, { otp });

  } catch (error) {
    console.error('Error sending OTP email:', error);
    return sendResponse(res, 500, 'Failed to send OTP email.', null, false);
  }

  sendResponse(res, 200, 'OTP sent to your email. Please verify to continue.');
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp, name, phone, type, activeProfile = 'client' } = req.body;

  if (!email || !otp || !type) {
    return sendResponse(res, 400, 'Email, OTP, and type are required', null, false);
  }

  const otpData = await Otp.findOne({ identifier: email, otp, expiresAt: { $gt: new Date() } });

  if (!otpData) {
    return sendResponse(res, 400, 'Invalid or expired OTP', null, false);
  }

  let user = await User.findOne({ email });
  let activeProfileId;
  let activeProfileImage;
  let profileName;

  if (type === 'registration' && !user) {
    let profileId;
    if (activeProfile === 'tenant') {
      const newTenant = new Tenant({ companyName: name, email, phone, isActive: true, smtpSetting: {}, emailSetting: {} });
      await newTenant.save();
      profileId = newTenant._id;
      activeProfileImage = newTenant.profileImageUrl;
      profileName = newTenant.companyName;
    } else {
      const newClient = new Client({ name, email, phone, isActive: true });
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
    return sendResponse(res, 404, 'User not found. Please register.', null, false);
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
      profileName = 'client';
      console.log(client);
    }
  }

  if (user) {
    const token = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });

    sendResponse(res, 200, 'OTP verified and user processed successfully.', {
      token,
      userId: user._id,
      activeProfile: user.activeProfile,
      activeProfileId,
      activeProfileImage,
      profileName
    });
  } else {
    return sendResponse(res, 400, 'Could not process user.', null, false);
  }
});

const createProfile = asyncHandler(async (req, res) => {
  const { name, email, profileType, phone, profileImageUrl } = req.body;
  const { userId } = req.params;

  if (!name || !email || !profileType) {
    return sendResponse(res, 400, 'Name, email, and profileType are required', null, false);
  }

  const user = await User.findById(userId);

  if (!user) {
    return sendResponse(res, 404, 'User not found', null, false);
  }

  let profile;
  if (profileType === 'tenant') {
    profile = new Tenant({ companyName: name, email, phone, profileImageUrl: profileImageUrl, smtpSetting: {}, emailSetting: {} });
  } else if (profileType === 'client') {
    profile = new Client({ name, email, phone, profileImageUrl });
  } else {
    return sendResponse(res, 400, "Invalid profileType. Must be 'tenant' or 'client'.", null, false);
  }

  await profile.save();

  const newMapping = new UserTenantClientMapping({
    userId: userId,
    masterId: profile._id,
    role: profileType,
  });

  await newMapping.save();

  sendResponse(res, 201, 'User profile created successfully.', profile);
});

const updateProfile = asyncHandler(async (req, res) => {
  const { userId, profileId } = req.params;
  const { name, email, phone, profileImageUrl, profileType } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return sendResponse(res, 404, 'User not found', null, false);
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
    return sendResponse(res, 404, 'Profile not found.', null, false);
  }

  sendResponse(res, 200, 'Profile updated successfully.', profile);
});

const mergeProfiles = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { sourceProfileId, targetProfileId, profileType } = req.body;

  if (!sourceProfileId || !targetProfileId || !profileType) {
    return sendResponse(res, 400, 'Source profile ID, target profile ID, and profile type are required.', null, false);
  }

  if (sourceProfileId === targetProfileId) {
    return sendResponse(res, 400, 'Source and target profile IDs cannot be the same.', null, false);
  }

  const user = await User.findById(userId);
  if (!user) {
    return sendResponse(res, 404, 'User not found.', null, false);
  }

  const targetMapping = await UserTenantClientMapping.findOne({ userId, masterId: targetProfileId, role: profileType });

  if (!targetMapping) {
    return sendResponse(res, 404, 'One or both profiles do not belong to the specified user or do not exist.', null, false);
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

  sendResponse(res, 200, `Successfully merged profile ${sourceProfileId} into profile ${targetProfileId}.`, {});
});

const verifyInvitation = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return sendResponse(res, 400, 'Invitation token is required', null, false);
  }

  const client = await Client.findOne({
    invitationToken: token
  });

  if (!client) {
    return sendResponse(res, 400, 'Invalid or expired invitation token.', null, false);
  }

  client.isActive = true;
  client.invitationToken = null;
  await client.save();

  sendResponse(res, 200, 'Invitation verified successfully. You can now log in.', {});
});

const register = asyncHandler(async (req, res) => {
  sendResponse(res, 400, 'Registration is now handled via the /verify-otp endpoint with type registration.', null, false);
});

const login = asyncHandler(async (req, res) => {
  sendResponse(res, 400, 'Login is now handled via the /send-otp and /verify-otp endpoints with type login.', null, false);
});

const logout = asyncHandler(async (req, res) => {
  sendResponse(res, 200, 'Logged out successfully', {});
});

const switchAccount = asyncHandler(async (req, res) => {
  const { activeProfile, masterId } = req.body;
  const { userId } = req.params;

  if (!activeProfile || !masterId) {
    return sendResponse(res, 400, 'activeProfile and masterId are required', null, false);
  }

  const mapping = await UserTenantClientMapping.findOne({
    userId,
    masterId,
    role: activeProfile
  });

  if (!mapping) {
    return sendResponse(res, 404, 'No account found for the provided details.', null, false);
  }

  const user = await User.findById(userId);
  if (!user) {
    return sendResponse(res, 404, 'User not found.', null, false);
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

  sendResponse(res, 200, 'Profile switch successfully.', {
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
    return sendResponse(res, 404, 'No accounts found for this user.', null, false);
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

  sendResponse(res, 200, 'Accounts retrieved successfully', { accounts: validAccounts });
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