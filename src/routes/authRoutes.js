const express = require('express');
const {
    register,
    login,
    logout,
    getMe,
    updateDetails,
    updatePassword
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { validate, validationSchemas } = require('../middlewares/validation');

const router = express.Router();

router.post('/register', validate(validationSchemas.auth.register), register);
router.post('/login', validate(validationSchemas.auth.login), login);

// All routes below are protected
router.use(protect);

router.post('/logout', logout);
router.get('/me', getMe);
router.put('/updatedetails', validate(validationSchemas.auth.updateDetails), updateDetails);
router.put('/updatepassword', validate(validationSchemas.auth.updatePassword), updatePassword);

module.exports = router;

