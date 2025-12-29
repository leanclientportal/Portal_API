const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { protect } = require('../middlewares/auth');
const {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  markAsPaid
} = require('../controllers/invoiceController');
const {
  validate,
  validateParams,
  validationSchemas,
  objectIdSchema
} = require('../middlewares/validation');

// All routes are protected
router.use(protect);

const projectParamSchema = Joi.object({
  projectId: objectIdSchema.required()
});

const invoiceParamSchema = Joi.object({
  projectId: objectIdSchema.required(),
  invoiceId: objectIdSchema.required()
});

router.route('/:projectId')
  .get(validateParams(projectParamSchema), getInvoices)
  .post(
    validateParams(projectParamSchema),
    validate(validationSchemas.invoice.create),
    createInvoice
  );

router.route('/:projectId/:invoiceId')
  .put(
    validateParams(invoiceParamSchema),
    validate(validationSchemas.invoice.update),
    updateInvoice
  )
  .delete(validateParams(invoiceParamSchema), deleteInvoice);

router.route('/:projectId/:invoiceId/pay')
  .put(validateParams(invoiceParamSchema), markAsPaid);

module.exports = router;
