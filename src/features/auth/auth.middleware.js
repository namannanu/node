const authController = require('./auth.controller'); // Removed space after ./
const AppError = require('../../shared/utils/appError');

exports.protect = authController.protect;
exports.restrictTo = authController.restrictTo;

exports.checkPermissions = (requiredPermission) => {
  return (req, _res, next) => {
    if (req.user.role === 'admin') return next();
    
    if (!req.user.permissions || !req.user.permissions.includes(requiredPermission)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};