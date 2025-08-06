const express = require('express');
const cors = require('cors');
const colors = require('colors');
const morgan = require('morgan');
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
    'http://localhost:8080',  // Vite dev server
    'http://localhost:8081',  // Alternative Vite dev server port
    'http://localhost:3000',  // React dev server (if used)
    'http://localhost:5173',  // Alternative Vite port
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'https://your-vercel-app.vercel.app', // Add your Vercel domain
    'https://*.vercel.app' // Allow all Vercel domains
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

// Only use morgan in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Import and use feature routes with error handling
try {
  const authRoutes = require('../src/features/auth/auth.routes');
  app.use('/api/auth', authRoutes);
} catch (error) {
  console.warn('Auth routes failed to load:', error.message);
}

try {
  const eventRoutes = require('../src/features/events/event.routes');
  app.use('/api/events', eventRoutes);
} catch (error) {
  console.warn('Event routes failed to load:', error.message);
}

try {
  const organizerRoutes = require('../src/features/organizers/organizer.routes');  
  app.use('/api/organizers', organizerRoutes);
} catch (error) {
  console.warn('Organizer routes failed to load:', error.message);
}

try {
  const ticketRoute = require('../src/features/tickets/ticket.routes');
  app.use('/api/tickets', ticketRoute);
} catch (error) {
  console.warn('Ticket routes failed to load:', error.message);
}

try {
  const feedbackRoutes = require('../src/features/feedback/feedback.routes');
  app.use('/api/feedback', feedbackRoutes);
} catch (error) {
  console.warn('Feedback routes failed to load:', error.message);
}

try {
  const adminRoutes = require('../src/features/admin/admin.routes');
  app.use('/api/admin', adminRoutes);
} catch (error) {
  console.warn('Admin routes failed to load:', error.message);
}

try {
  const registrationRoutes = require('../src/features/registrations/userEventRegistration.routes');
  app.use('/api/registrations', registrationRoutes);
} catch (error) {
  console.warn('Registration routes failed to load:', error.message);
}

try {
  const userRoutesNew = require('../src/features/users/user.routes');
  app.use('/api/users', userRoutesNew);
} catch (error) {
  console.warn('User routes failed to load (AWS dependency issue):', error.message);
}

// Basic Routes
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/', (req, res) => res.send('Hello from Vercel!'));
app.get('/favicon.png', (req, res) => res.status(204).end());

// Test route for API health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is working on Vercel!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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
