const express = require('express');
const {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice
} = require('../controllers/invoiceController');
const { 
  validate, 
  validateQuery,
  validateParams,
  validationSchemas, 
  objectIdSchema 
} = require('../middlewares/validation');
const Joi = require('joi');

const router = express.Router();

const paramSchemaList = Joi.object({
  tenantId: objectIdSchema.required(),
  clientId: objectIdSchema.required(),
  projectId: objectIdSchema.required()
});

const paramSchemaDetail = Joi.object({
  tenantId: objectIdSchema.required(),
  clientId: objectIdSchema.required(),
  projectId: objectIdSchema.required(),
  invoiceId: objectIdSchema.required()
});

router.route('/:tenantId/:clientId/:projectId')
  .get(
    validateParams(paramSchemaList),
    validateQuery(validationSchemas.pagination),
    getInvoices
  )
  .post(
    validateParams(paramSchemaList),
    validate(validationSchemas.invoice.create),
    createInvoice
  );

router.route('/:tenantId/:clientId/:projectId/:invoiceId')
  .put(
    validateParams(paramSchemaDetail),
    updateInvoice
  )
  .delete(validateParams(paramSchemaDetail), deleteInvoice);

module.exports = router;