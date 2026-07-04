const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const homeownerRoutes = require('./routes/homeowner.routes');
const houseRoutes = require('./routes/house.routes');
const reservationRoutes = require('./routes/reservation.routes');
const financeRoutes = require('./routes/finance.routes');
const uploadRoutes = require('./routes/upload');
const { errorHandler } = require('./middleware/errorHandler');
const swaggerSpec = require('./config/swagger');

const app = express();

// Trust proxy for Render
app.set('trust proxy', true);

// Security middleware
app.use(helmet());

// Request logging
app.use(morgan('dev'));

// CORS and body parsing
app.use(cors());
app.use(express.json());

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/homeowners', homeownerRoutes);
app.use('/api/houses', houseRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling middleware (must be after routes)
app.use(errorHandler);

module.exports = app;
