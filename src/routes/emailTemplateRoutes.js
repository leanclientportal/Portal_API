const express = require('express');
const {
  getEmailTemplateTypes,
  getEmailTemplates,
  getEmailTemplateById,
  getPreloadEmailTemplate,
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

router.route('/:tenantId/preload/:templateTypeCode')
  .get(protect, getPreloadEmailTemplate);

router.route('/:tenantId/:templateId')
  .get(protect, getEmailTemplateById)
  .put(protect, updateEmailTemplate)
  .delete(protect, deleteEmailTemplate);

module.exports = router;
