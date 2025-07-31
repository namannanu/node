const express = require('express');
const authController = require('./auth.controller');

const router = express.Router();

// Protected route to get current user info
router.get('/', authController.protect, authController.getCurrentUser);

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

module.exports = router;