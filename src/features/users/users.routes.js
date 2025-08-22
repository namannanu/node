const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth/auth.middleware');
const { getPresignedUrls } = require('./presigned-url.controller');

// Add this new route for pre-signed URLs
router.get('/:userId/presigned-urls', authMiddleware, getPresignedUrls);

// Keep your existing routes below
// ... rest of your routes

module.exports = router;
