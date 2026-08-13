// Express app configuration
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const { sanitizationMiddleware } = require('./middleware/sanitization');

const app = express();

// Security Middleware
app.use(helmet());

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (env.frontendUrl.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`);
      console.warn(`Allowed origins: ${JSON.stringify(env.frontendUrl)}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Logging
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input Sanitization
app.use(sanitizationMiddleware);

// Static Files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SIWES E-Logbook API is running',
    environment: env.nodeEnv,
    allowedOrigins: env.frontendUrl,
    timestamp: new Date().toISOString(),
  });
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
  swaggerOptions: { url: '/swagger.json' },
}));

app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/students', require('./modules/students/students.routes'));
app.use('/api/log-entries', require('./modules/log-entries/logEntries.routes'));
app.use('/api/supervisors', require('./modules/supervisors/supervisors.routes'));
app.use('/api/admin', require('./modules/admin/admin.routes'));
app.use('/api/notifications', require('./modules/notifications/notifications.routes'));
app.use('/api/files', require('./modules/files/files.routes'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
      details: {},
    },
  });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
