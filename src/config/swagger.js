const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SIWES E-Logbook API',
      description: 'Complete API documentation for SIWES E-Logbook Backend System',
      version: '1.0.0',
      contact: {
        name: 'API Support',
        email: 'support@siwes.local',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development Server',
      },
      {
        url: 'https://yourdomain.com/api',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  example: 'Validation failed',
                },
                details: {
                  type: 'object',
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            role: {
              type: 'string',
              enum: ['student', 'industry_supervisor', 'school_supervisor', 'admin'],
            },
            matric_number: {
              type: 'string',
            },
            department: {
              type: 'string',
            },
            phone: {
              type: 'string',
            },
            is_active: {
              type: 'boolean',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        LogEntry: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            student_id: {
              type: 'string',
              format: 'uuid',
            },
            date: {
              type: 'string',
              format: 'date',
            },
            week_number: {
              type: 'integer',
            },
            activity_description: {
              type: 'string',
            },
            tools_equipment: {
              type: 'string',
            },
            skills_acquired: {
              type: 'string',
            },
            challenges_faced: {
              type: 'string',
            },
            status: {
              type: 'string',
              enum: ['draft', 'pending', 'approved', 'rejected'],
            },
            supervisor_comment: {
              type: 'string',
            },
            files: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/File',
              },
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        File: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            file_name: {
              type: 'string',
            },
            original_name: {
              type: 'string',
            },
            file_type: {
              type: 'string',
            },
            file_size: {
              type: 'integer',
            },
            url: {
              type: 'string',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            user_id: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
            },
            message: {
              type: 'string',
            },
            type: {
              type: 'string',
              enum: ['approval', 'rejection', 'feedback', 'submission', 'info'],
            },
            is_read: {
              type: 'boolean',
            },
            related_entry_id: {
              type: 'string',
              format: 'uuid',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
            },
            data: {
              type: 'object',
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
            },
            data: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                },
                pagination: {
                  type: 'object',
                  properties: {
                    page: {
                      type: 'integer',
                    },
                    limit: {
                      type: 'integer',
                    },
                    total: {
                      type: 'integer',
                    },
                    pages: {
                      type: 'integer',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/modules/auth/auth.routes.js',
    './src/modules/students/students.routes.js',
    './src/modules/log-entries/logEntries.routes.js',
    './src/modules/supervisors/supervisors.routes.js',
    './src/modules/admin/admin.routes.js',
    './src/modules/notifications/notifications.routes.js',
    './src/modules/files/files.routes.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
