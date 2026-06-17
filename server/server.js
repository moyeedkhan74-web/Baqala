const express = require('express');
process.setMaxListeners(50);
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const connectDB = require('./config/db');
const { generalLimiter } = require('./middleware/rateLimiter');

// Route imports
const authRoutes = require('./routes/auth');
const appRoutes = require('./routes/apps');
const reviewRoutes = require('./routes/reviews');
const assetsRoutes = require('./routes/assets');
const downloadRoutes = require('./routes/downloads');
const adminRoutes = require('./routes/admin');
const reportsRoutes = require('./routes/reports');
const configRoutes = require('./routes/config');
const notificationRoutes = require('./routes/notifications');

const app = express();
app.set('trust proxy', 1); // Trust Render's proxy for accurate IP tracking

// CORS Configuration (Moved up for early execution)
const allowedOrigins = [
  'https://baqala-lovat.vercel.app',
  'https://baqala-lovat-git-main-moyeedkhan74-webs-projects.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin);
    const isVercelPreview = origin.endsWith('.vercel.app');
    
    if (isAllowed || isVercelPreview) {
      return callback(null, true);
    } else {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie', 'Content-Disposition', 'Content-Length', 'Access-Control-Allow-Origin'],
  optionsSuccessStatus: 200
}));

const compression = require('compression');

// Connect to MongoDB
connectDB();

// Performance and Security middleware
app.use(compression({
  filter: (req, res) => {
    // Skip compression for assets as they are already optimized/compressed image formats
    if (req.path.startsWith('/api/assets')) return false;
    // Fallback to standard filter
    return compression.filter(req, res);
  }
})); // Compress other responses

// Helmet Configuration for enhanced security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'unsafe-none' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://apis.google.com"],
      connectSrc: ["'self'", ...allowedOrigins],
      imgSrc: ["'self'", "data:", "https://*"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      upgradeInsecureRequests: [],
    },
  },
}));
app.use(generalLimiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const userRoutes = require('./routes/users');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/apps', appRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/config', configRoutes);
app.use('/api/contact', require('./routes/contact'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  console.error(`[SERVER ERROR] ${req.method} ${req.path}:`, err.message);
  if (isDevelopment) console.error(err.stack);
  
  res.status(statusCode).json({
    message: isDevelopment ? err.message : 'Internal server error.',
    error: err.message,
    ...(isDevelopment && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Email Provider Sanity Check
  if (!process.env.RESEND_API_KEY) {
    console.warn('\x1b[33m%s\x1b[0m', '⚠️  [CONFIG_WARNING]: RESEND_API_KEY is not set.');
    console.warn('\x1b[33m%s\x1b[0m', '    Falling back to Gmail SMTP, which is known to time out frequently on Render.');
    console.warn('\x1b[33m%s\x1b[0m', '    Please set RESEND_API_KEY for reliable notification delivery.');
  } else {
    console.log('\x1b[32m%s\x1b[0m', '✅ [CONFIG]: Resend Email Service is configured.');
  }

  // System Diagnostics Snapshot
  try {
    const { getSystemInfo } = require('./controllers/adminController');
    const diagnostics = await getSystemInfo();
    console.log('\n🔍 [SYSTEM_DIAGNOSTICS_SNAPSHOT]');
    console.log('-------------------------------------------');
    Object.entries(diagnostics).forEach(([key, value]) => {
      console.log(`${key.padEnd(20)}: ${value}`);
    });
    console.log('-------------------------------------------\n');
  } catch (diagError) {
    console.error('[DIAGNOSTICS_FAILED]:', diagError.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});