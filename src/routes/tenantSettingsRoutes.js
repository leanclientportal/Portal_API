const express = require('express');
const {
  getSmtpSettings,
  updateSmtpSettings,
  getEmailSettings,
  updateEmailSettings,
  getGeneralSettings,
  updateGeneralSettings,
} = require('../controllers/tenantSettingsController');

const router = express.Router();

// Route to get and update SMTP settings
router.route('/:tenantId/settings/smtp').get(getSmtpSettings).put(updateSmtpSettings);

// Route to get and update email settings
router.route('/:tenantId/settings/email').get(getEmailSettings).put(updateEmailSettings);

// Route to get and update general settings
router.route('/:tenantId/settings/general').get(getGeneralSettings).put(updateGeneralSettings);

module.exports = router;
