const express = require('express');
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  upload
} = require('../controllers/clientController');
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
  tenantId: objectIdSchema.required()
});

const paramSchemaDetail = Joi.object({
  clientId: objectIdSchema.required()
});

router.route('/:tenantId')
  .get(
    validateParams(paramSchemaList),
    validateQuery(validationSchemas.pagination),
    getClients
  )
  .post(
    validateParams(paramSchemaList),
    upload.single('profile'),
    validate(validationSchemas.client.create),
    createClient
  );

router.route('/:clientId')
  .get(
    validateParams(paramSchemaDetail),
    getClientById
  )
  .put(
    validateParams(paramSchemaDetail),
    upload.single('profile'),
    validate(validationSchemas.client.update),
    updateClient
  )
  .delete(validateParams(paramSchemaDetail), deleteClient);

module.exports = router;