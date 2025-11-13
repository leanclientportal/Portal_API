const Joi = require('joi');

// Common validation schemas
const objectIdSchema = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ID format');

const validationSchemas = {
  // Tenant validation
  tenant: {
    create: Joi.object({
      email: Joi.string().email().required(),
      phone: Joi.string().min(7).max(20),
      brandColor: Joi.string(),
      companyName: Joi.string().min(2).max(200).required(),
      customDomain: Joi.string(),
      emailEnabled: Joi.boolean(),
      isActive: Joi.boolean(),
      logoUrl: Joi.string().uri(),
      plan: objectIdSchema,
      whatsappEnabled: Joi.boolean(),
      profileUrl: Joi.string().uri(),
      credential: Joi.object({
        password: Joi.string().min(6),
        passwordSalt: Joi.string(),
        createdDate: Joi.date()
      })
    }),
    update: Joi.object({
      email: Joi.string().email(),
      phone: Joi.string().min(7).max(20),
      brandColor: Joi.string(),
      companyName: Joi.string().min(2).max(200),
      customDomain: Joi.string(),
      emailEnabled: Joi.boolean(),
      isActive: Joi.boolean(),
      logoUrl: Joi.string().uri(),
      plan: objectIdSchema,
      whatsappEnabled: Joi.boolean(),
      profileUrl: Joi.string().uri(),
      credential: Joi.object({
        password: Joi.string().min(6),
        passwordSalt: Joi.string(),
        createdDate: Joi.date()
      })
    })
  },

  // Client validation
  client: {
    create: Joi.object({
      tenantId: objectIdSchema.optional(),
      name: Joi.string().required().min(2).max(100),
      email: Joi.string().email().required(),
      phone: Joi.string().min(7).max(20),
      isActive: Joi.boolean(),
      profileUrl: Joi.string().uri(),
      profileImageUrl: Joi.string()
    }),
    update: Joi.object({
      name: Joi.string().min(2).max(100),
      email: Joi.string().email(),
      phone: Joi.string().min(7).max(20),
      isActive: Joi.boolean(),
      profileUrl: Joi.string().uri(),
      profileImageUrl: Joi.string()
    })
  },

  // Project validation
  project: {
    create: Joi.object({
      name: Joi.string().required().min(2).max(200),
      description: Joi.string().max(2000),
      status: Joi.string().valid('planning', 'active', 'on-hold', 'completed', 'cancelled'),
      isActive: Joi.boolean()
    }),
    update: Joi.object({
      name: Joi.string().min(2).max(200),
      description: Joi.string().max(2000),
      status: Joi.string().valid('planning', 'active', 'on-hold', 'completed', 'cancelled'),
      isActive: Joi.boolean()
    })
  },

  // Task validation
  task: {
    create: Joi.object({
      title: Joi.string().required().min(2).max(200),
      description: Joi.string().max(2000),
      status: Joi.string().valid('todo', 'in-progress', 'in-review', 'completed', 'cancelled'),
      createdDate: Joi.date(),
      dueDate: Joi.date(),
      visibleToClient: Joi.boolean()
    }),
    update: Joi.object({
      title: Joi.string().min(2).max(200),
      description: Joi.string().max(2000),
      status: Joi.string().valid('todo', 'in-progress', 'in-review', 'completed', 'cancelled'),
      createdDate: Joi.date(),
      dueDate: Joi.date(),
      visibleToClient: Joi.boolean()
    })
  },

  // Document validation
  document: {
    create: Joi.object({
      projectId: objectIdSchema.required(),
      clientId: objectIdSchema.required(),
      url: Joi.string().uri().required(),
      name: Joi.string().required().min(1).max(300),
      tag: Joi.string().max(100),
      uploadedBy: Joi.string().valid('admin', 'client'),
      uploaderId: objectIdSchema
    }),
    update: Joi.object({
      url: Joi.string().uri(),
      name: Joi.string().min(1).max(300),
      tag: Joi.string().max(100),
      uploadedBy: Joi.string().valid('admin', 'client'),
      uploaderId: objectIdSchema
    })
  },

  // Invoice validation
  invoice: {
    create: Joi.object({
      projectId: objectIdSchema.required(),
      clientId: objectIdSchema.required(),
      url: Joi.string().uri(),
      amount: Joi.number().min(0).required(),
      discount: Joi.number().min(0),
      dueAmount: Joi.number().min(0),
      dueDate: Joi.date(),
      paymentLink: Joi.string(),
      status: Joi.number()
    }),
    update: Joi.object({
      url: Joi.string().uri(),
      amount: Joi.number().min(0),
      discount: Joi.number().min(0),
      dueAmount: Joi.number().min(0),
      dueDate: Joi.date(),
      paymentLink: Joi.string(),
      status: Joi.number()
    })
  },

  // NotificationLog validation
  notificationLog: {
    create: Joi.object({
      tenantId: objectIdSchema.required(),
      clientId: objectIdSchema,
      eventType: Joi.number().required(),
      channel: Joi.number().required(),
      status: Joi.number(),
      sentDate: Joi.date()
    }),
    update: Joi.object({
      tenantId: objectIdSchema,
      clientId: objectIdSchema,
      eventType: Joi.number(),
      channel: Joi.number(),
      status: Joi.number(),
      sentDate: Joi.date()
    })
  },

  // Plan validation
  plan: {
    create: Joi.object({
      name: Joi.string().required().min(2).max(200),
      isActive: Joi.boolean()
    }),
    update: Joi.object({
      name: Joi.string().min(2).max(200),
      isActive: Joi.boolean()
    })
  },

  // Status validation
  status: {
    create: Joi.object({
      name: Joi.string().required().min(1).max(100),
      statusId: Joi.number().required()
    }),
    update: Joi.object({
      name: Joi.string().min(1).max(100),
      statusId: Joi.number()
    })
  },

  // Auth validation
  auth: {
    sendOtp: Joi.object({
      email: Joi.string().email().required().messages({ 'string.email': 'Enter a valid email' })
    }),
    verifyOtp: Joi.object({
      email: Joi.string().email().required().messages({ 'string.email': 'Enter a valid email' }),
      otp: Joi.string().length(6).required().messages({ 'string.length': 'Enter a valid 6-digit OTP' })
    }),
    register: Joi.object({
      email: Joi.string().email().required().messages({ 'string.email': 'Enter a valid email' }),
      phone: Joi.string().optional(),
      password: Joi.string().min(6).required().messages({ 'string.min': 'Password must be at least 6 characters long' }),
      activeProfile: Joi.string().valid('client', 'tenant').default('client')
    }),
    login: Joi.object({
      emailOrPhone: Joi.string().required().messages({ 'any.required': 'Enter email or phone number' }),
      password: Joi.string().required().messages({ 'any.required': 'Enter password' })
    }),
    updateDetails: Joi.object({
      name: Joi.string().min(2).max(200),
      email: Joi.string().email(),
      phone: Joi.string().min(7).max(20)
    }),
    updatePassword: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().required().min(6)
    })
  },

  // Pagination validation
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string(),
    search: Joi.string()
  })
};

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      error.isJoi = true;
      return next(error);
    }

    req.body = value;
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);

    if (error) {
      error.isJoi = true;
      return next(error);
    }

    req.query = value;
    next();
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params);

    if (error) {
      error.isJoi = true;
      return next(error);
    }

    req.params = value;
    next();
  };
};

module.exports = {
  validationSchemas,
  validate,
  validateQuery,
  validateParams,
  objectIdSchema
};
