const express = require('express');
const { protect } = require('../middlewares/auth');
const {
  getDocuments,
  getDocument,
  uploadDocument,
  updateDocument,
  deleteDocument
} = require('../controllers/documentController');
const {
  validate,
  validateQuery,
  validateParams,
  validationSchemas,
  objectIdSchema
} = require('../middlewares/validation');
const Joi = require('joi');

const router = express.Router();

// router.use(protect);

const paramSchemaList = Joi.object({
  projectId: objectIdSchema.required()
});

const paramSchemaDetail = Joi.object({
  projectId: objectIdSchema.required(),
  documentId: objectIdSchema.required()
});

router.route('/:projectId')
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

router.route('/:projectId/:documentId')
  .get(validateParams(paramSchemaDetail), getDocument)
  .put(validateParams(paramSchemaDetail), validate(validationSchemas.document.update), updateDocument)
  .delete(validateParams(paramSchemaDetail), deleteDocument);

router.get(
  '/:projectId/:documentId/download',
  validateParams(paramSchemaDetail),
);

module.exports = router;
