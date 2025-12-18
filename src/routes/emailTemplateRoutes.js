const express = require('express');
const router = express.Router();
const {
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
} = require('../controllers/emailTemplateController');

// All routes in this file are protected

// Route to get all email templates for the authenticated tenant and create a new one
router.route('/').get(getEmailTemplates).post(createEmailTemplate);

// Routes to update and delete a specific email template
router.route('/:id').put(updateEmailTemplate).delete(deleteEmailTemplate);

module.exports = router;
