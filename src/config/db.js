const mongoose = require('mongoose');
const colors = require('colors');

const connectDB = async () => {
    console.log('🔄 Attempting to connect to MongoDB...'.yellow); // Debug log
    
    if (!process.env.MONGO_URI) {
        console.error('❌ MONGO_URI environment variable is not set'.red.bold);
        process.exit(1);
    }
    
    try {
        console.log('🔄 Connecting to MongoDB...'.yellow); // Debug log
        
        // Set Mongoose-specific options
        mongoose.set('bufferCommands', false); // Disable command buffering
        
        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            // Remove the problematic bufferMaxEntries option
            // bufferCommands is handled by Mongoose, not MongoDB driver
        };
        
        const conn = await mongoose.connect(process.env.MONGO_URI, options);
        
        console.log(`✅ MongoDB connected: ${conn.connection.host}`.cyan.bold);
        console.log(`✅ Database: ${conn.connection.name}`.cyan);
        console.log(`✅ Connection state: ${mongoose.connection.readyState}`.green);
        
        // Add connection event listeners
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err.message.red);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️  MongoDB disconnected'.yellow);
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected'.green);
        });
        
        // Return the mongoose connection instance
        return mongoose.connection;
        
    } catch (error) {
        console.error(`❌ MongoDB connection error: ${error.message}`.red.bold);
        console.error('🔍 Full error details:', error);
        
        // More specific error messages
        if (error.message.includes('ENOTFOUND')) {
            console.error('🌐 Network error: Cannot reach MongoDB server'.red);
        } else if (error.message.includes('authentication failed')) {
            console.error('🔐 Authentication error: Check MongoDB credentials'.red);
        }
        
        // Don't exit immediately in serverless environment
        if (process.env.NODE_ENV === 'production') {
            console.error('⚠️  Continuing without database connection in production'.yellow);
            throw error; // Still throw to let caller handle
        } else {
            process.exit(1);
        }
    }
};

module.exports = connectDB;