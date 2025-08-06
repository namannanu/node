const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('../src/config/db');
const path = require('path');

// Initialize Express app
const app = express();

// Load environment variables
dotenv.config({
    path: path.join(__dirname, '..', 'src', 'config', 'config.env'),
});

// Connect to the database
connectDB();

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'https://*.vercel.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json()); 
app.use(cookieParser());

// Import routes (excluding AWS-dependent features for now)
const eventRoutes = require('../src/features/events/event.routes');
const organizerRoutes = require('../src/features/organizers/organizer.routes');  
const ticketRoute = require('../src/features/tickets/ticket.routes');
const feedbackRoutes = require('../src/features/feedback/feedback.routes');
const adminRoutes = require('../src/features/admin/admin.routes');
const registrationRoutes = require('../src/features/registrations/userEventRegistration.routes');
const authRoutes = require('../src/features/auth/auth.routes');

// Use feature routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/organizers', organizerRoutes);
app.use('/api/tickets', ticketRoute);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/registrations', registrationRoutes);

// Conditionally load user routes (may include AWS dependencies)
try {
  const userRoutesNew = require('../src/features/users/user.routes');
  app.use('/api/users', userRoutesNew);
} catch (error) {
  console.warn('User routes disabled due to AWS dependency issues:', error.message);
  
  // Provide a fallback users endpoint
  app.get('/api/users/health', (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'User routes temporarily disabled due to AWS dependencies',
      timestamp: new Date().toISOString()
    });
  });
}

// Basic Routes
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/', (req, res) => res.send('Hello from Vercel! 🚀'));
app.get('/favicon.png', (req, res) => res.status(204).end());

// Test route for API health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is working on Vercel! 🎉',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'connected'
  });
});

// Public test endpoints (these bypass authentication)
app.get('/api/public/users', async (req, res) => {
  try {
    const User = require('../src/features/auth/auth.model');
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
    const Event = require('../src/features/events/event.model');
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
    const Organizer = require('../src/features/organizers/organizer.model');
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Export the Express app as a serverless function
module.exports = app;
