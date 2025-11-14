const express = require('express');
const {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject
} = require('../controllers/projectController');
const { protect } = require('../middlewares/auth');
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
  clientId: objectIdSchema.required()
});

const paramSchemaDetail = Joi.object({
  projectId: objectIdSchema.required()
});

router.route('/:activeProfile/:activeProfileId')
  .get(
    validateQuery(validationSchemas.pagination),
    getProjects
  );

router.route('/:tenantId/:clientId')
  .post(
    validateParams(paramSchemaList),
    validate(validationSchemas.project.create),
    createProject
  );

router.route('/:projectId')
  .get(validateParams(paramSchemaDetail), getProject)
  .put(
    validateParams(paramSchemaDetail),
    validate(validationSchemas.project.update),
    updateProject
  )
  .delete(validateParams(paramSchemaDetail), deleteProject);

module.exports = router;