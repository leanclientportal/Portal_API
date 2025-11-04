const express = require('express');
const { getTenant, updateTenant } = require('../controllers/tenantController');
const { validate, validationSchemas, validateParams, objectIdSchema } = require('../middlewares/validation');
const Joi = require('joi');

const router = express.Router();

const paramSchema = Joi.object({
  tenantId: objectIdSchema.required()
});

router.route('/:tenantId')
  .get(validateParams(paramSchema), getTenant)
  .put(
    validateParams(paramSchema), 
    validate(validationSchemas.tenant.update), 
    updateTenant
  );

module.exports = router;