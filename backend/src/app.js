const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./utils/database');
const { errorHandler, notFound } = require('./middleware/error');

// Import debug logging and feature flags
const { logger, debugLoggers } = require('./utils/debugLogger');
const featureFlags = require('./utils/featureFlags');

// Route imports
const authRoutes = require('./routes/auth');
const domainRoutes = require('./routes/domains');
const sessionRoutes = require('./routes/sessions');
const profileRoutes = require('./routes/profile');
const inferenceRoutes = require('./routes/inferenceRoutes');
const resultRoutes = require('./routes/results');
const adminRoutes = require('./routes/admin');
const adminDomainRoutes = require('./routes/adminDomains');
const { router: debugRoutes } = require('./routes/debug');

// Connect to database
connectDB();

// Log feature flags configuration
featureFlags.logConfiguration(logger);

const app = express();

// Security middlewares
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy (for accurate IP addresses behind reverse proxy)
app.set('trust proxy', 1);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SkillNavigator Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/inference', inferenceRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/domains', adminDomainRoutes);

// Debug routes (only enabled in staging/development)
app.use('/api/debug', debugRoutes);

// 404 handler - must be after all routes
app.use('*', notFound);

// Error handling middleware - must be last
app.use(errorHandler);

module.exports = app;