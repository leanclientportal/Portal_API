const express = require('express');
const {
  getEmailTemplateTypes,
  getEmailTemplates,
  getEmailTemplateById,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate
} = require('../controllers/emailTemplateController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.route('/types').get(protect, getEmailTemplateTypes);

router.route('/:tenantId')
  .get(protect, getEmailTemplates)
  .post(protect, createEmailTemplate);

router.route('/:tenantId/:templateId')
  .get(protect, getEmailTemplateById)
  .put(protect, updateEmailTemplate)
  .delete(protect, deleteEmailTemplate);

module.exports = router;
