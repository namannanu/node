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

// Connect to the database
connectDB();

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:8080',  // Vite dev server
    'http://localhost:3000',  // React dev server (if used)
    'http://localhost:5173',  // Alternative Vite port
    'http://127.0.0.1:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
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

// Use feature routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/organizers', organizerRoutes);
app.use('/api/tickets', ticketRoute);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/users', userRoutesNew);

// Basic Routes
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/', (req, res) => res.send('Hello, World!'));
app.get('/favicon.png', (req, res) => res.status(204).end());

// Test route for API health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is working!',
    timestamp: new Date().toISOString()
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

// Define PORT and start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on: ${PORT}`.blue.underline.bold));
