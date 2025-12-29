const express = require('express');
const { protect } = require('../middlewares/auth');
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');
const {
  validate,
  validateQuery,
  validateParams,
  validationSchemas,
  objectIdSchema
} = require('../middlewares/validation');
const Joi = require('joi');

const router = express.Router();

router.use(protect);

const paramSchemaList = Joi.object({
  projectId: objectIdSchema.required()
});

const paramSchemaGetList = Joi.object({
  projectId: objectIdSchema.required(),
  activeProfile: objectIdSchema.required()
});
const paramSchemaDetail = Joi.object({
  projectId: objectIdSchema.required(),
  taskId: objectIdSchema.required()
});

const taskListQuery = validationSchemas.pagination.keys({
  status: Joi.string().valid('todo', 'in-progress', 'in-review', 'completed', 'cancelled'),
});

router.route('/:projectId/:activeProfile')
  .get(
    validateQuery(taskListQuery),
    getTasks
  )
router.route('/:projectId')
  .post(
    validateParams(paramSchemaList),
    validate(validationSchemas.task.create),
    createTask
  );

router.route('/:projectId/:taskId')
  .put(
    validateParams(paramSchemaDetail),
    validate(validationSchemas.task.update),
    updateTask
  )
  .delete(validateParams(paramSchemaDetail), deleteTask);

module.exports = router;