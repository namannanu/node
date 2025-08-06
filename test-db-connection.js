#!/usr/bin/env node

// Test database connection
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({
    path: path.join(__dirname, 'src', 'config', 'config.env'),
});

const connectDB = require('./src/config/db');
const mongoose = require('mongoose');

const testDatabaseConnection = async () => {
    try {
        console.log('🧪 Testing database connection...');
        console.log('📍 MONGO_URI exists:', !!process.env.MONGO_URI);
        
        // Test connection
        await connectDB();
        
        // Test a simple operation
        console.log('🔍 Testing database operation...');
        const User = require('./src/features/auth/auth.model');
        
        // Simple count operation to test if connection works
        const userCount = await User.countDocuments();
        console.log(`✅ Found ${userCount} users in database`);
        
        // Test connection state
        console.log(`✅ Connection state: ${mongoose.connection.readyState}`);
        console.log('📊 Connection states: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting');
        
        console.log('🎉 Database connection test PASSED!'.green);
        
        // Close connection
        await mongoose.connection.close();
        console.log('✅ Connection closed cleanly');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Database connection test FAILED:', error.message);
        console.error('🔍 Error details:', error);
        process.exit(1);
    }
};

// Run the test
testDatabaseConnection();
