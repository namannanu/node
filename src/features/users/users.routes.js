const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth/auth.middleware');
const { getPresignedUrls } = require('./presigned-url.controller');

// Debug route to verify API is working
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Users API is working',
        timestamp: new Date().toISOString()
    });
});

// Test route to verify API is accessible
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Users API is working',
        timestamp: new Date().toISOString()
    });
});

// Add this new route for pre-signed URLs
router.get('/:userId/presigned-urls', authMiddleware, getPresignedUrls);

// Keep your existing routes below
// ... rest of your routes

module.exports = router;
