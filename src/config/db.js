const mongoose = require('mongoose');
const colors = require('colors');

const connectDB = async () => {
    console.log('Attempting to connect to MongoDB...'); // Debug log
    
    if (!process.env.MONGO_URI) {
        console.error('MONGO_URI environment variable is not set'.red.bold);
        process.exit(1);
    }
    
    try {
        console.log('Connecting to MongoDB...'); // Debug log
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // MongoDB connection options for better compatibility
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferCommands: false
        });
        console.log(`MongoDB connected: ${conn.connection.host}`.cyan.bold);
    } catch (error) {
        console.error(`MongoDB connection error: ${error.message}`.red.bold);
        // Don't exit immediately in serverless environment
        if (process.env.NODE_ENV === 'production') {
            console.error('Continuing without database connection in production');
        } else {
            process.exit(1);
        }
    }
};

module.exports = connectDB;