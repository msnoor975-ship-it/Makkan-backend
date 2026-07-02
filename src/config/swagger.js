const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Suz Backend API',
      version: '1.0.0',
      description: 'API for managing real estate listings, customers, homeowners, reservations, and financial accounts',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // User schema from Prisma
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            role: {
              type: 'string',
              enum: ['sales_employee', 'rental_employee', 'manager', 'secretary'],
            },
            fullName: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Customer schema from Prisma
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            fullName: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string', format: 'email' },
            status: { type: 'string' },
            addedByUserId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Homeowner schema from Prisma
        Homeowner: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            fullName: { type: 'string' },
            phone: { type: 'string' },
            addedByUserId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // House schema from Prisma
        House: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            address: { type: 'string' },
            specifications: { type: 'string' },
            price: { type: 'number', format: 'decimal' },
            listingType: {
              type: 'string',
              enum: ['sale', 'rent'],
            },
            status: {
              type: 'string',
              enum: ['available', 'reserved', 'sold'],
            },
            homeownerId: { type: 'string', format: 'uuid' },
            addedByUserId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Reservation schema from Prisma
        Reservation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            customerId: { type: 'string', format: 'uuid' },
            houseId: { type: 'string', format: 'uuid' },
            handledByUserId: { type: 'string', format: 'uuid' },
            reservationDate: { type: 'string', format: 'date-time' },
            status: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // FinancialAccount schema from Prisma
        FinancialAccount: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            category: {
              type: 'string',
              enum: ['utilities', 'wages', 'household_expenses', 'tenant_expenses'],
            },
            amount: { type: 'number', format: 'decimal' },
            description: { type: 'string' },
            entryDate: { type: 'string', format: 'date-time' },
            recordedByUserId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // Request schemas based on Zod validators
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string' },
            password: { type: 'string' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: { type: 'string' },
            newPassword: { type: 'string', minLength: 6 },
          },
        },
        CreateCustomerRequest: {
          type: 'object',
          required: ['fullName', 'status'],
          properties: {
            fullName: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string', format: 'email' },
            status: { type: 'string' },
          },
        },
        UpdateCustomerRequest: {
          type: 'object',
          properties: {
            fullName: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string', format: 'email' },
            status: { type: 'string' },
          },
        },
        CreateHomeownerRequest: {
          type: 'object',
          required: ['fullName'],
          properties: {
            fullName: { type: 'string' },
            phone: { type: 'string' },
          },
        },
        UpdateHomeownerRequest: {
          type: 'object',
          properties: {
            fullName: { type: 'string' },
            phone: { type: 'string' },
          },
        },
        CreateHouseRequest: {
          type: 'object',
          required: ['address', 'price', 'listingType', 'status', 'homeownerId'],
          properties: {
            address: { type: 'string' },
            specifications: { type: 'string' },
            price: { type: 'number' },
            listingType: {
              type: 'string',
              enum: ['sale', 'rent'],
            },
            status: {
              type: 'string',
              enum: ['available', 'reserved', 'sold'],
            },
            homeownerId: { type: 'string', format: 'uuid' },
          },
        },
        UpdateHouseRequest: {
          type: 'object',
          properties: {
            address: { type: 'string' },
            specifications: { type: 'string' },
            price: { type: 'number' },
            listingType: {
              type: 'string',
              enum: ['sale', 'rent'],
            },
            status: {
              type: 'string',
              enum: ['available', 'reserved', 'sold'],
            },
            homeownerId: { type: 'string', format: 'uuid' },
          },
        },
        SearchAndReserveRequest: {
          type: 'object',
          required: ['customerId'],
          properties: {
            customerId: { type: 'string', format: 'uuid' },
            listingType: {
              type: 'string',
              enum: ['sale', 'rent'],
            },
            minPrice: { type: 'number' },
            maxPrice: { type: 'number' },
            location: { type: 'string' },
            reservationDate: { type: 'string', format: 'date-time' },
          },
        },
        CreateFinanceRequest: {
          type: 'object',
          required: ['category', 'amount'],
          properties: {
            category: {
              type: 'string',
              enum: ['utilities', 'wages', 'household_expenses', 'tenant_expenses'],
            },
            amount: { type: 'number', minimum: 0 },
            description: { type: 'string' },
            entryDate: { type: 'string', format: 'date-time' },
          },
        },
        // Error response schema
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                code: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
