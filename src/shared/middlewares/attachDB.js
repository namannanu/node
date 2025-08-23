const mongoose = require('mongoose');

// Middleware to attach database connection to request
const attachDBMiddleware = (req, res, next) => {
    if (mongoose.connection.readyState === 1) {
        req.db = mongoose.connection.db;
        next();
    } else {
        console.error('❌ Database connection not ready');
        res.status(500).json({
            success: false,
            message: 'Database connection error'
        });
    }
};

module.exports = attachDBMiddleware;
