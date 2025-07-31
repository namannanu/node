const express = require('express');
const adminController = require('./admin.controller');
const authMiddleware = require('../auth/auth.middleware');

const router = express.Router();

// Test route without auth (for development only)
router.get('/activity', adminController.getActivityLog);

// Apply auth middleware to protected routes
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin'));

router.route('/admin-users')
  .get(adminController.getAllAdminUsers)
  .post(adminController.createAdminUser);

router.route('/employees')
  .get(adminController.getAllEmployees)
  .post(adminController.createEmployee);

router.route('/employees/:id')
  .delete(adminController.deleteEmployee);

router.route('/admin-users/:id')
  .patch(adminController.updateAdminUser)
  .delete(adminController.deleteAdminUser);

router.patch('/employees/permissions', adminController.updateEmployeePermissions);

module.exports = router;