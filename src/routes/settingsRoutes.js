const express = require('express');
const {
  getSmtpSettings,
  updateSmtpSettings,
  getEmailSettings,
  updateEmailSettings,
  getGeneralSettings,
  updateGeneralSettings,
} = require('../controllers/settingsController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Route to get and update SMTP settings
router.route('/:tenantId/settings/smtp').get(protect, getSmtpSettings).put(protect, updateSmtpSettings);

// Route to get and update email settings
router.route('/:tenantId/settings/email').get(protect, getEmailSettings).put(protect, updateEmailSettings);

// Route to get and update general settings
router.route('/:activeProfileId/:activeProfile/settings_general').get(protect, getGeneralSettings).put(protect, updateGeneralSettings);

module.exports = router;
