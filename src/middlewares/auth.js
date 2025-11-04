const asyncHandler = require('./asyncHandler');
const jwt = require('jsonwebtoken');
const Tenant = require('../models/Tenant');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        // Set token from Bearer token in header
        token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');

        req.tenant = await Tenant.findById(decoded.id);

        if (!req.tenant) {
            return res.status(401).json({
                success: false,
                message: 'Tenant not found'
            });
        }

        if (!req.tenant.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is inactive'
            });
        }

        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.tenant) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        if (!roles.includes(req.tenant.role)) {
            return res.status(403).json({
                success: false,
                message: `Tenant role '${req.tenant.role}' is not authorized to access this route`
            });
        }
        next();
    };
};

