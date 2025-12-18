const express = require('express');
const {
  getSmtpSettings,
  updateSmtpSettings,
  getEmailSettings,
  updateEmailSettings,
} = require('../controllers/tenantSettingsController');

const router = express.Router();

// Route to get and update SMTP settings
router.route('/:tenantId/settings/smtp').get(getSmtpSettings).put(updateSmtpSettings);

// Route to get and update email settings
router.route('/:tenantId/settings/email').get(getEmailSettings).put(updateEmailSettings);

module.exports = router;
