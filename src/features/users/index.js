const express = require('express');
const router = express.Router();
const { getPresignedUrls } = require('./presigned-url.controller');
const authMiddleware = require('../auth/auth.middleware');

// Debug route to verify the endpoint is accessible
router.get('/debug', (req, res) => {
    res.json({
        success: true,
        message: 'Users API is working',
        routes: [
            '/api/users/:userId/presigned-urls',
            // list other routes here
        ]
    });
});

// Pre-signed URLs route
router.get('/:userId/presigned-urls', authMiddleware, getPresignedUrls);

// Export the router
module.exports = router;
