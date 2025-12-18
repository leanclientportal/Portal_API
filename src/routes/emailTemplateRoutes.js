const express = require('express');
const {
  getEmailTemplateTypes,
  getEmailTemplates,
  getEmailTemplateById,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate
} = require('../controllers/emailTemplateController');

const router = express.Router();

router.route('/types').get(getEmailTemplateTypes);

router.route('/:tenantId')
  .get(getEmailTemplates)
  .post(createEmailTemplate);

router.route('/:tenantId/:templateId')
  .get(getEmailTemplateById)
  .put(updateEmailTemplate)
  .delete(deleteEmailTemplate);

module.exports = router;
