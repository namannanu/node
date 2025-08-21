const express = require('express');
const cors = require('cors');
const colors = require('colors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const path = require('path');

// Initialize Express app first
const app = express();

dotenv.config({
    path: path.join(__dirname, 'config', 'config.env'),
});

// Debug environment variables
console.log('Environment check:');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Found' : 'NOT FOUND');
console.log('PORT:', process.env.PORT || 'Using default 3000');
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Found' : 'NOT FOUND');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Found' : 'NOT FOUND');
console.log('AWS_REGION:', process.env.AWS_REGION || 'ap-south-1');

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:8080',  // Vite dev server
    'http://localhost:8081',  // Alternative Vite dev server port
    'http://localhost:3000',  // React dev server (if used)
    'http://localhost:5173',  // Alternative Vite port
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL // Your Vercel frontend URL
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); 
app.use(cookieParser());
app.use(morgan('dev'));

// Import and use feature routes
const eventRoutes = require('./features/events/event.routes');
const organizerRoutes = require('./features/organizers/organizer.routes');  
const ticketRoute = require('./features/tickets/ticket.routes');
const feedbackRoutes = require('./features/feedback/feedback.routes');
const adminRoutes = require('./features/admin/admin.routes');
const registrationRoutes = require('./features/registrations/userEventRegistration.routes');
const userRoutesNew = require('./features/users/user.routes');
const authRoutes = require('./features/auth/auth.routes');
const amplifyRoutes = require('./features/aws/routes/amplify');

// Use feature routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/organizers', organizerRoutes);
app.use('/api/tickets', ticketRoute);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/users', userRoutesNew);
app.use('/api', amplifyRoutes);

// Basic Routes
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/', (req, res) => res.send('Hello, World!'));
app.get('/favicon.png', (req, res) => res.status(204).end());

// Test route for API health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// AWS status check endpoint
app.get('/api/aws-status', (req, res) => {
  // Import the S3 client from amplify route to check status
  const amplifyRouter = require('./features/aws/routes/amplify');
  
  // This is a simplified check - in practice you might want to 
  // expose the s3Available status from your amplify module
  res.status(200).json({
    status: 'success',
    awsConfigured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
    awsRegion: process.env.AWS_REGION || 'ap-south-1',
    bucket: 'nfacialimagescollections',
    message: 'AWS status check complete'
  });
});

// Simple route to test users without auth (for debugging)
app.get('/api/users/test', async (req, res) => {
  try {
    const User = require('./features/auth/auth.model');
    const users = await User.find().select('-password').limit(10);
    res.status(200).json({
      status: 'success',
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Simple route to test events without auth (for debugging)
app.get('/api/events/test', async (req, res) => {
  try {
    const Event = require('./features/events/event.model');
    const events = await Event.find().limit(10);
    res.status(200).json({
      status: 'success',
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Simple route to test organizers without auth (for debugging)
app.get('/api/organizers/test', async (req, res) => {
  try {
    const Organizer = require('./features/organizers/organizer.model');
    const organizers = await Organizer.find().limit(10);
    res.status(200).json({
      status: 'success',
      count: organizers.length,
      data: organizers
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Public test endpoints (these bypass authentication)
app.get('/api/public/users', async (req, res) => {
  try {
    const User = require('./features/auth/auth.model');
    const users = await User.find().select('-password').limit(10);
    res.status(200).json({
      status: 'success',
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.get('/api/public/events', async (req, res) => {
  try {
    const Event = require('./features/events/event.model');
    const events = await Event.find().populate('organizer').limit(10);
    res.status(200).json({
      status: 'success',
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.get('/api/public/organizers', async (req, res) => {
  try {
    const Organizer = require('./features/organizers/organizer.model');
    const organizers = await Organizer.find().limit(10);
    res.status(200).json({
      status: 'success',
      count: organizers.length,
      data: organizers
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Define PORT
const PORT = process.env.PORT || 3000;

// Start server function - Wait for database connection first
const startServer = async () => {
  try {
    console.log('🚀 Starting application...'.blue.bold);
    
    // Connect to database first and wait for it to complete
    console.log('🔄 Establishing database connection...'.yellow);
    await connectDB();
    console.log('✅ Database connection established successfully!'.green.bold);
    
    // Only start the server after database is connected
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on: http://localhost:${PORT}`.blue.underline.bold);
      console.log('🎉 Server is ready to accept requests!'.green.bold);
      console.log('📡 API endpoints are now available'.cyan);
      console.log('🌐 AWS S3 Status:', 
        (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) 
        ? 'Configured'.green 
        : 'Not Configured'.red);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received. Shutting down gracefully...'.yellow);
      server.close(() => {
        console.log('✅ Server closed successfully.'.green);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received. Shutting down gracefully...'.yellow);
      server.close(() => {
        console.log('✅ Server closed successfully.'.green);
        process.exit(0);
      });
    });
    
    return server;
    
  } catch (error) {
    console.error('❌ Failed to start server:'.red.bold);
    console.error('🔍 Error details:', error.message.red);
    console.error('📋 Full error:', error);
    
    // Provide helpful error messages
    if (error.message.includes('MONGO_URI')) {
      console.error('💡 Tip: Check your MongoDB connection string in config.env'.yellow);
    } else if (error.message.includes('EADDRINUSE')) {
      console.error('💡 Tip: Port is already in use. Try a different port or kill existing processes'.yellow);
    }
    
    process.exit(1);
  }
};

// Start the application
startServer();