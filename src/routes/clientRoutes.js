const express = require('express');
const multer = require('multer');
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
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

// Configure Multer for in-memory storage
const upload = multer({ storage: multer.memoryStorage() });

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

router.route('/:tenantId/:clientId') // Modified route to include tenantId
  .get(
    validateParams(Joi.object({ tenantId: objectIdSchema.required(), clientId: objectIdSchema.required() })),
    getClientById
  )
  .put(
    validateParams(Joi.object({ tenantId: objectIdSchema.required(), clientId: objectIdSchema.required() })),
    upload.single('profile'),
    validate(validationSchemas.client.update),
    updateClient
  )
  .delete(
    validateParams(Joi.object({ tenantId: objectIdSchema.required(), clientId: objectIdSchema.required() })),
    deleteClient
  );

module.exports = router;