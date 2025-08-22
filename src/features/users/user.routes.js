const express = require('express');
const userController = require('./user.controller');
const authMiddleware = require('../auth/auth.middleware');
const getPresignedUrls = require('./presigned-url.controller');

const router = express.Router();

router.use(authMiddleware.protect);

router.get('/me', userController.getMyProfile);

router.route('/')
  .get(authMiddleware.restrictTo('admin', 'employee'), userController.getAllUsers);

router.route('/:id')
  .get(userController.getUser)
  .patch(authMiddleware.restrictTo('admin', 'employee'), userController.updateUser)
  .delete(authMiddleware.restrictTo('admin'), userController.deleteUser);

// Pre-signed URLs route
router.get('/:userId/presigned-urls', getPresignedUrls);

router.post('/verify-face', 
  authMiddleware.restrictTo('admin', 'employee'), 
  userController.verifyUserFace);

module.exports = router;