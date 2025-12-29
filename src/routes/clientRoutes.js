const express = require('express');
const multer = require('multer');
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  resendInvitation,
  getClientListForDropdown
} = require('../controllers/clientController');
const {
  validate,
  validateQuery,
  validateParams,
  validationSchemas,
  objectIdSchema
} = require('../middlewares/validation');
const { protect } = require('../middlewares/auth');
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
    protect,
    validateParams(paramSchemaList),
    validateQuery(validationSchemas.pagination),
    getClients
  )
  .post(
    protect,
    validateParams(paramSchemaList),
    upload.single('profile'),
    validate(validationSchemas.client.create),
    createClient
  );

router.route('/:tenantId/dropdown')
  .get(
    protect,
    validateParams(paramSchemaList),
    getClientListForDropdown
  );

router.route('/:tenantId/:clientId') // Modified route to include tenantId
  .get(
    protect,
    validateParams(Joi.object({ tenantId: objectIdSchema.required(), clientId: objectIdSchema.required() })),
    getClientById
  )
  .put(
    protect,
    validateParams(Joi.object({ tenantId: objectIdSchema.required(), clientId: objectIdSchema.required() })),
    upload.single('profile'),
    validate(validationSchemas.client.update),
    updateClient
  )
  .delete(
    protect,
    validateParams(Joi.object({ tenantId: objectIdSchema.required(), clientId: objectIdSchema.required() })),
    deleteClient
  );

router.route('/:tenantId/:clientId/resend-invitation')
  .post(
    protect,
    validateParams(Joi.object({ tenantId: objectIdSchema.required(), clientId: objectIdSchema.required() })),
    resendInvitation
  );

module.exports = router;