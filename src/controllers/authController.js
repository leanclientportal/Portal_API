const Tenant = require('../models/Tenant');
const asyncHandler = require('../middlewares/asyncHandler');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key-change-this', {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });
};

// @desc    Register new tenant
// @route   POST /api/v1/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;

    // Check if tenant exists
    const tenantExists = await Tenant.findOne({ email });

    if (tenantExists) {
        return res.status(400).json({
            success: false,
            message: 'Tenant already exists'
        });
    }

    // Create tenant
    const tenant = await Tenant.create({
        name,
        email,
        password,
        phone
    });

    // Generate token
    const token = generateToken(tenant._id);

    res.status(201).json({
        success: true,
        message: 'Tenant registered successfully',
        data: {
            token,
            tenant: {
                id: tenant._id,
                name: tenant.name,
                email: tenant.email,
                phone: tenant.phone,
                isActive: tenant.isActive
            }
        }
    });
});

// @desc    Login tenant
// @route   POST /api/v1/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Please provide email and password'
        });
    }

    // Check for tenant
    const tenant = await Tenant.findOne({ email }).select('+password');

    if (!tenant) {
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }

    // Check if tenant is active
    if (!tenant.isActive) {
        return res.status(401).json({
            success: false,
            message: 'Account is inactive'
        });
    }

    // Check if password matches
    const isMatch = await tenant.comparePassword(password);

    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }

    // Generate token
    const token = generateToken(tenant._id);

    res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
            token,
            tenant: {
                id: tenant._id,
                name: tenant.name,
                email: tenant.email,
                phone: tenant.phone,
                isActive: tenant.isActive
            }
        }
    });
});

// @desc    Logout tenant
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
    // In a stateless JWT implementation, logout is typically handled client-side
    // by removing the token. However, we can implement token blacklisting or
    // simply confirm logout here.

    res.status(200).json({
        success: true,
        message: 'Logout successful'
    });
});

// @desc    Get current logged in tenant
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    const tenant = await Tenant.findById(req.tenant.id);

    res.status(200).json({
        success: true,
        data: tenant
    });
});

// @desc    Update tenant details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
const updateDetails = asyncHandler(async (req, res) => {
    const fieldsToUpdate = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone
    };

    const tenant = await Tenant.findByIdAndUpdate(req.tenant.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: tenant
    });
});

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
const updatePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const tenant = await Tenant.findById(req.tenant.id).select('+password');

    // Check current password
    if (!(await tenant.comparePassword(currentPassword))) {
        return res.status(401).json({
            success: false,
            message: 'Password is incorrect'
        });
    }

    tenant.password = newPassword;
    await tenant.save();

    const token = generateToken(tenant._id);

    res.status(200).json({
        success: true,
        message: 'Password updated successfully',
        data: {
            token
        }
    });
});

module.exports = {
    register,
    login,
    logout,
    getMe,
    updateDetails,
    updatePassword
};

