const asyncHandler = require('./asyncHandler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    // Log all headers for debugging
    console.log('Request Headers:', req.headers);

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        // Set token from Bearer token in header
        token = req.headers.authorization.split(' ')[1];
        console.log('Extracted Token:', token); // Log the extracted token
    }

    // Make sure token exists
    if (!token) {
        console.log('No token found or token did not start with Bearer');
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route: No token provided'
        });
    }

    try {
        // Check if JWT_SECRET is defined, otherwise throw an error
        if (!config.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in environment variables.');
        }
        // Verify token
        const decoded = jwt.verify(token, config.JWT_SECRET);

        req.user = await User.findById(decoded.id);

        if (!req.user) {
            console.log('User not found for decoded ID:', decoded.id);
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route: User not found'
            });
        }

        req.userId = decoded.id;
        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        return res.status(401).json({
            success: false,
            message: `Not authorized to access this route: ${err.message}`
        });
    }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        if (!roles.includes(req.user.activeProfile)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.activeProfile}' is not authorized to access this route`
            });
        }

        next();
    };
};