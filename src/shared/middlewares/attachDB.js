const mongoose = require('mongoose');

// Middleware to attach database connection to request
const attachDBMiddleware = async (req, res, next) => {
    try {
        // If not connected, try to connect
        if (mongoose.connection.readyState !== 1) {
            console.log('📡 Attempting to reconnect to database...');
            await mongoose.connect(process.env.MONGO_URI, {
                maxPoolSize: 1,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 30000,
                connectTimeoutMS: 10000,
                keepAlive: true,
                keepAliveInitialDelay: 300000,
                autoIndex: false,
            });
        }
        
        req.db = mongoose.connection.db;
        next();
    } catch (error) {
        console.error('❌ Database connection error:', error);
        res.status(500).json({
            success: false,
            message: 'Database connection error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = attachDBMiddleware;
