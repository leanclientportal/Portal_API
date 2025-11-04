const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Lean Client Portal API',
      version: '1.0.0',
      description: 'A comprehensive REST API for managing clients, projects, tasks, and invoices in a multi-tenant environment',
      contact: {
        name: 'API Support',
        email: 'support@leanclientportal.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' ? 'https://api.leanclientportal.com' : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            error: {
              type: 'string',
              example: 'Detailed error description'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            current: {
              type: 'integer',
              example: 1
            },
            total: {
              type: 'integer',
              example: 10
            },
            count: {
              type: 'integer',
              example: 20
            },
            totalRecords: {
              type: 'integer',
              example: 200
            }
          }
        },
        Tenant: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '60d5ecb54b24a1d5f83f4a1a'
            },
            name: {
              type: 'string',
              example: 'Acme Corporation'
            },
            email: {
              type: 'string',
              example: 'admin@acme.com'
            },
            phone: {
              type: 'string',
              example: '+1-555-123-4567'
            },
            website: {
              type: 'string',
              example: 'https://acme.com'
            },
            businessType: {
              type: 'string',
              example: 'Technology'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Client: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '60d5ecb54b24a1d5f83f4a1b'
            },
            tenantId: {
              type: 'string',
              example: '60d5ecb54b24a1d5f83f4a1a'
            },
            name: {
              type: 'string',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              example: 'john@example.com'
            },
            company: {
              type: 'string',
              example: 'Example Inc'
            },
            phone: {
              type: 'string',
              example: '+1-555-987-6543'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'prospective'],
              example: 'active'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Project: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '60d5ecb54b24a1d5f83f4a1c'
            },
            tenantId: {
              type: 'string',
              example: '60d5ecb54b24a1d5f83f4a1a'
            },
            clientId: {
              type: 'string',
              example: '60d5ecb54b24a1d5f83f4a1b'
            },
            name: {
              type: 'string',
              example: 'Website Redesign'
            },
            description: {
              type: 'string',
              example: 'Complete redesign of company website'
            },
            status: {
              type: 'string',
              enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled'],
              example: 'active'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              example: 'high'
            },
            progress: {
              type: 'integer',
              minimum: 0,
              maximum: 100,
              example: 75
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Task: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '60d5ecb54b24a1d5f83f4a1d'
            },
            tenantId: {
              type: 'string',
              example: '60d5ecb54b24a1d5f83f4a1a'
            },
            clientId: {
              type: 'string',
              example: '60d5ecb54b24a1d5f83f4a1b'
            },
            projectId: {
              type: 'string',
              example: '60d5ecb54b24a1d5f83f4a1c'
            },
            title: {
              type: 'string',
              example: 'Design homepage mockup'
            },
            description: {
              type: 'string',
              example: 'Create wireframes and mockups for the new homepage'
            },
            status: {
              type: 'string',
              enum: ['todo', 'in-progress', 'in-review', 'completed', 'cancelled'],
              example: 'in-progress'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              example: 'high'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Invoice: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '60d5ecb54b24a1d5f83f4a1e'
            },
            tenantId: {
              type: 'string',
              example: '60d5ecb54b24a1d5f83f4a1a'
            },
            clientId: {
              type: 'string',
              example: '60d5ecb54b24a1d5f83f4a1b'
            },
            projectId: {
              type: 'string',
              example: '60d5ecb54b24a1d5f83f4a1c'
            },
            invoiceNumber: {
              type: 'string',
              example: 'INV-2024-0001'
            },
            title: {
              type: 'string',
              example: 'Website Development - Phase 1'
            },
            status: {
              type: 'string',
              enum: ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'],
              example: 'sent'
            },
            subtotal: {
              type: 'number',
              example: 5000.00
            },
            total: {
              type: 'number',
              example: 5500.00
            },
            currency: {
              type: 'string',
              example: 'USD'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Document: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '60d5ecb54b24a1d5f83f4a1f'
            },
            tenantId: {
              type: 'string',
              example: '60d5ecb54b24a1d5f83f4a1a'
            },
            clientId: {
              type: 'string',
              example: '60d5ecb54b24a1d5f83f4a1b'
            },
            projectId: {
              type: 'string',
              example: '60d5ecb54b24a1d5f83f4a1c'
            },
            filename: {
              type: 'string',
              example: 'project-requirements.pdf'
            },
            originalName: {
              type: 'string',
              example: 'Project Requirements v1.0.pdf'
            },
            description: {
              type: 'string',
              example: 'Initial project requirements document'
            },
            category: {
              type: 'string',
              enum: ['contract', 'proposal', 'invoice', 'report', 'design', 'requirement', 'other'],
              example: 'requirement'
            },
            mimetype: {
              type: 'string',
              example: 'application/pdf'
            },
            size: {
              type: 'number',
              example: 1024000
            },
            url: {
              type: 'string',
              example: 'https://res.cloudinary.com/your-cloud/raw/upload/v1234567890/documents/project-requirements.pdf'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js'] // Path to the API files
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};