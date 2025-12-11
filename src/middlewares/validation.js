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
      profileImageUrl: Joi.string().uri(),
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
      profileImageUrl: Joi.string().uri(),
    })
  },

  // Client validation
  client: {
    create: Joi.object({
      name: Joi.string().required().min(2).max(100),
      email: Joi.string().email().required(),
      phone: Joi.string().allow('', null).optional(),
      isActive: Joi.boolean(),
      profileImageUrl: Joi.string().uri().optional(),
    }),
    update: Joi.object({
      name: Joi.string().min(2).max(100),
      email: Joi.string().email(),
      phone: Joi.string().allow('', null).optional(),
      isActive: Joi.boolean(),
      profileImageUrl: Joi.string().uri().optional(),
    })
  },

  // Project validation
  project: {
    create: Joi.object({
      name: Joi.string().required().min(2).max(200),
      description: Joi.string().max(2000),
      status: Joi.string().valid('active', 'on-hold', 'completed'),
      isDeleted:Joi.boolean(),
    }),
    update: Joi.object({
      name: Joi.string().min(2).max(200),
      description: Joi.string().max(2000),
      status: Joi.string().valid('active', 'on-hold', 'completed'),
      isDeleted:Joi.boolean(),
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
      name: Joi.string().required().min(1).max(300),
      docUrl: Joi.string().uri().required(),
      uploadedBy: Joi.string().valid('Tenant', 'Client'),
      uploaderId: objectIdSchema,
      isOverwrite:  Joi.boolean()
    }),
    update: Joi.object({
      name: Joi.string().min(1).max(300),
      docUrl: Joi.string().uri(),
      uploadedBy: Joi.string().valid('Tenant', 'Client'),
      uploaderId: objectIdSchema,
      isOverwrite:  Joi.boolean()
    })
  },

  // Invoice validation
  invoice: {
    create: Joi.object({
      invoiceUrl: Joi.string().uri().optional(),
      title: Joi.string().required().min(2).max(200),
      status: Joi.string().valid('pending', 'paid'),
      invoiceDate: Joi.date().required(),
      amount: Joi.number().required(),
      dueDate: Joi.date().required(),
      paidDate: Joi.date().optional(),
      paymentLink: Joi.string().optional(),
    }),
    update: Joi.object({
      invoiceUrl: Joi.string().uri().optional(),
      title: Joi.string().required().min(2).max(200),
      invoiceDate: Joi.date().required(),
      status: Joi.string().valid('pending', 'paid'),
      amount: Joi.number().required(),
      dueDate: Joi.date().required(),
      paidDate: Joi.date().optional(),
      paymentLink: Joi.string().optional(),
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
      email: Joi.string().email().required().messages({ 'string.email': 'Enter a valid email' }),
      type: Joi.string().valid('registration', 'login').required()
    }),
    verifyOtp: Joi.object({
      email: Joi.string().email().required().messages({ 'string.email': 'Enter a valid email' }),
      otp: Joi.string().length(6).required().messages({ 'string.length': 'Enter a valid 6-digit OTP' }),
      type: Joi.string().valid('registration', 'login').required(),
      name: Joi.string().min(2).max(200).when('type', { is: 'registration', then: Joi.required() }),
      phone: Joi.string().min(7).max(20).optional(),
      activeProfile: Joi.string().valid('client', 'tenant').optional(),
      activeProfileId: objectIdSchema.optional(),
    }),
    register: Joi.object({
      email: Joi.string().email().required().messages({ 'string.email': 'Enter a valid email' }),
      phone: Joi.string().optional(),
      activeProfile: Joi.string().valid('client', 'tenant').default('client')
    }),
    login: Joi.object({
      emailOrPhone: Joi.string().required().messages({ 'any.required': 'Enter email or phone number' }),
      password: Joi.string().required().messages({ 'any.required': 'Enter password' })
    }),
    updateDetails: Joi.object({
      name: Joi.string().min(2).max(200),
      email: Joi.string().email(),
      phone: Joi.string().allow('', null).optional()
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
