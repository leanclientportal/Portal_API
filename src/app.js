require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Database connection
const connectDB = require('./config/database');

// Middleware imports
const errorHandler = require('./middlewares/errorHandler');

// Route imports
const userAuthRoutes = require('./routes/userAuthRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const clientRoutes = require('./routes/clientRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const documentRoutes = require('./routes/documentRoutes');
const emailTemplateRoutes = require('./routes/emailTemplateRoutes'); // Added email template routes
const tenantSettingsRoutes = require('./routes/tenantSettingsRoutes');
const messageRoutes = require('./routes/messageRoutes');
const chatRoutes = require('./routes/chatRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Swagger documentation
const { swaggerUi, specs } = require('./config/swagger');

const app = express();

// Connect to database
connectDB();

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

// Middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser requests or when no origin header is present
    if (!origin) return callback(null, true);
    // If no origins configured, allow all (useful for development)
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
// Explicitly handle preflight requests for all routes
app.options('*', cors(corsOptions));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// API Routes
const API_VERSION = '/api/v1';

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Lean Client Portal API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customSiteTitle: 'Lean Client Portal API Documentation',
  customfavIcon: '/favicon.ico',
  customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css'
}));

// Mount routes
app.use(`${API_VERSION}/auth`, userAuthRoutes);
app.use(`${API_VERSION}/tenant`, tenantRoutes);
app.use(`${API_VERSION}/tenant`, tenantSettingsRoutes);
app.use(`${API_VERSION}/clients`, clientRoutes);
app.use(`${API_VERSION}/projects`, projectRoutes);
app.use(`${API_VERSION}/tasks`, taskRoutes);
app.use(`${API_VERSION}/invoices`, invoiceRoutes);
app.use(`${API_VERSION}/documents`, documentRoutes);
app.use(`${API_VERSION}/email-templates`, emailTemplateRoutes); // Added email template routes
app.use(`${API_VERSION}/messages`, messageRoutes);
app.use(`${API_VERSION}/chats`, chatRoutes);
app.use(`${API_VERSION}/dashboard`, dashboardRoutes);

// Welcome message
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Lean Client Portal API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      auth: `${API_VERSION}/auth`,
      tenant: `${API_VERSION}/tenant/by-client/:clientId`,
      clients: `${API_VERSION}/clients/:tenantId`,
      projects: `${API_VERSION}/projects/:tenantId/:clientId`,
      tasks: `${API_VERSION}/tasks/:tenantId/:clientId/:projectId`,
      invoices: `${API_VERSION}/invoices/:tenantId/:clientId/:projectId`,
      documents: `${API_VERSION}/documents/:clientId/:projectId`,
      emailTemplates: `${API_VERSION}/email-templates` // Added email templates endpoint
    }
  });
});

// Handle 404 routes
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api-docs',
      `POST ${API_VERSION}/auth/register`,
      `POST ${API_VERSION}/auth/login`,
      `POST ${API_VERSION}/auth/logout`,
      `GET ${API_VERSION}/auth/me`,
      `GET ${API_VERSION}/tenant/by-client/:clientId`,
      `GET ${API_VERSION}/clients/:tenantId`,
      `GET ${API_VERSION}/projects/:tenantId/:clientId`,
      `GET ${API_VERSION}/tasks/:tenantId/:clientId/:projectId`,
      `GET ${API_VERSION}/invoices/:tenantId/:clientId/:projectId`,
      `GET ${API_VERSION}/documents/:clientId/:projectId`,
      `GET ${API_VERSION}/email-templates` // Added email templates endpoint
    ]
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3009;

const server = app.listen(PORT, () => {
  console.log(`🚀 Lean Client Portal API server running on port ${PORT}`);
  console.log(`📚 API Documentation available at: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Health check available at: http://localhost:${PORT}/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Promise Rejection:', err.message);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err.message);
  console.log('Shutting down the server due to uncaught exception');
  process.exit(1);
});

module.exports = app;
