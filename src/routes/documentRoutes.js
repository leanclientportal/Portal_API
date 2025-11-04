const express = require('express');
const {
  getDocuments,
  getDocument,
  uploadDocument,
  updateDocument,
  deleteDocument,
  downloadDocument
} = require('../controllers/documentController');
const {
  validateQuery,
  validateParams,
  validationSchemas,
  objectIdSchema,
  validate
} = require('../middlewares/validation');
const Joi = require('joi');

const router = express.Router();

const paramSchemaList = Joi.object({
  clientId: objectIdSchema.required(),
  projectId: objectIdSchema.required()
});

const paramSchemaDetail = Joi.object({
  clientId: objectIdSchema.required(),
  projectId: objectIdSchema.required(),
  documentId: objectIdSchema.required()
});

router.route('/:clientId/:projectId')
  .get(
    validateParams(paramSchemaList),
    validateQuery(validationSchemas.pagination),
    getDocuments
  )
  .post(
    validateParams(paramSchemaList),
    validate(validationSchemas.document.create),
    uploadDocument
  );

router.route('/:clientId/:projectId/:documentId')
  .get(validateParams(paramSchemaDetail), getDocument)
  .put(validateParams(paramSchemaDetail), validate(validationSchemas.document.update), updateDocument)
  .delete(validateParams(paramSchemaDetail), deleteDocument);

router.get(
  '/:clientId/:projectId/:documentId/download',
  validateParams(paramSchemaDetail),
  downloadDocument
);

module.exports = router;