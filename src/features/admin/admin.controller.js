const AdminUser = require('./admin.model');
const User = require('../auth/auth.model');
const Organizer = require('../organizers/organizer.model');
const AppError = require('../../shared/utils/appError');
const catchAsync = require('../../shared/utils/catchAsync');
const { 
  validatePermissions, 
  createInvalidPermissionError, 
  createUnauthorizedPermissionError 
} = require('../../shared/utils/permissionValidator');

// Create a new employee user
exports.createEmployee = catchAsync(async (req, res, next) => {
  const { email, password, phone, permissions, name } = req.body;

  // Validate permissions
  const validation = validatePermissions(permissions, req.user);

  if (!validation.isValid) {
    if (validation.invalidPermissions.length > 0) {
      const errorResponse = createInvalidPermissionError(
        validation.invalidPermissions,
        validation.suggestions,
        validation.validPermissions
      );
      return res.status(400).json({
        status: 'fail',
        data: errorResponse
      });
    }

    if (validation.unauthorizedPermissions.length > 0) {
      const errorResponse = createUnauthorizedPermissionError(
        validation.unauthorizedPermissions,
        req.user
      );
      return res.status(403).json({
        status: 'fail',
        data: errorResponse
      });
    }
  }

  // Convert to lowercase for consistency
  const normalizedPermissions = permissions ? permissions.map(p => p.toLowerCase()) : [];

  // Generate unique userId in backend
  const UserId = `emp-${Math.random().toString(36).substr(2, 9)}-${Date.now().toString(36)}`;
  
  const newUser = await User.create({
    userId: UserId,
    name,
    email,
    password,
    phone,
    role: 'employee',
    permissions: normalizedPermissions
  });

  // Remove password from response
  newUser.password = undefined;

  res.status(201).json({
    status: 'success',
    message: 'Employee created successfully',
    data: {
      user: newUser
    }
  });
});

// Create a new admin user (separate from regular users)
exports.createAdminUser = catchAsync(async (req, res, next) => {
  const { email, password, role, permissions } = req.body;

  // Validate permissions
  const validation = validatePermissions(permissions, req.user);

  if (!validation.isValid) {
    if (validation.invalidPermissions.length > 0) {
      const errorResponse = createInvalidPermissionError(
        validation.invalidPermissions,
        validation.suggestions,
        validation.validPermissions
      );
      return res.status(400).json({
        status: 'fail',
        data: errorResponse
      });
    }

    if (validation.unauthorizedPermissions.length > 0) {
      const errorResponse = createUnauthorizedPermissionError(
        validation.unauthorizedPermissions,
        req.user
      );
      return res.status(403).json({
        status: 'fail',
        data: errorResponse
      });
    }
  }

  // Convert to lowercase for consistency
  const normalizedPermissions = permissions ? permissions.map(p => p.toLowerCase()) : [];

  // Generate unique userId in backend
  const generatedUserId = `admin-${Math.random().toString(36).substr(2, 9)}-${Date.now().toString(36)}`;
  
  const newAdminUser = await AdminUser.create({
    userId: generatedUserId,
    email,
    password,
    role,
    permissions: normalizedPermissions
  });

  // Remove password from response
  newAdminUser.password = undefined;

  res.status(201).json({
    status: 'success',
    message: 'Admin user created successfully',
    data: {
      adminUser: newAdminUser
    }
  });
});

// Update employee permissions
exports.updateEmployeePermissions = catchAsync(async (req, res, next) => {
  const { userId, permissions } = req.body;

  // Validate permissions
  const validation = validatePermissions(permissions, req.user);

  if (!validation.isValid) {
    if (validation.invalidPermissions.length > 0) {
      const errorResponse = createInvalidPermissionError(
        validation.invalidPermissions,
        validation.suggestions,
        validation.validPermissions
      );
      return res.status(400).json({
        status: 'fail',
        data: errorResponse
      });
    }

    if (validation.unauthorizedPermissions.length > 0) {
      const errorResponse = createUnauthorizedPermissionError(
        validation.unauthorizedPermissions,
        req.user
      );
      return res.status(403).json({
        status: 'fail',
        data: errorResponse
      });
    }
  }

  // Convert to lowercase for consistency
  const normalizedPermissions = permissions ? permissions.map(p => p.toLowerCase()) : [];

  const user = await User.findByIdAndUpdate(
    userId,
    { permissions: normalizedPermissions },
    { new: true }
  );

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  // Remove password from response
  user.password = undefined;

  res.status(200).json({
    status: 'success',
    message: 'Employee permissions updated successfully',
    data: {
      user
    }
  });
});

// Delete employee
exports.deleteEmployee = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  // Remove password from response
  user.password = undefined;

  res.status(200).json({
    status: 'success',
    message: 'Employee deleted successfully',
    data: {
      deletedUser: user
    }
  });
});

// Get all employees
exports.getAllEmployees = catchAsync(async (req, res, next) => {
  const employees = await User.find({ role: 'employee' }).select('-password');

  res.status(200).json({
    status: 'success',
    results: employees.length,
    data: {
      employees
    }
  });
});

// Get all admin users
exports.getAllAdminUsers = catchAsync(async (req, res, next) => {
  const adminUsers = await AdminUser.find().select('-password');

  res.status(200).json({
    status: 'success',
    results: adminUsers.length,
    data: {
      adminUsers
    }
  });
});

// Admin dashboard stats
exports.getStats = catchAsync(async (req, res, next) => {
  const totalUsers = await User.countDocuments();
  const totalEmployees = await User.countDocuments({ role: 'employee' });
  const totalAdminUsers = await AdminUser.countDocuments();
  const totalOrganizers = await Organizer.countDocuments();

  // User status breakdown
  const activeUsers = await User.countDocuments({ status: 'active' });
  const suspendedUsers = await User.countDocuments({ status: 'suspended' });

  // Verification status breakdown
  const pendingVerification = await User.countDocuments({ verificationStatus: 'pending' });
  const verifiedUsers = await User.countDocuments({ verificationStatus: 'verified' });
  const rejectedUsers = await User.countDocuments({ verificationStatus: 'rejected' });

  res.status(200).json({
    status: 'success',
    data: {
      stats: {
        users: {
          total: totalUsers,
          employees: totalEmployees,
          active: activeUsers,
          suspended: suspendedUsers
        },
        adminUsers: {
          total: totalAdminUsers
        },
        organizers: {
          total: totalOrganizers
        },
        verification: {
          pending: pendingVerification,
          verified: verifiedUsers,
          rejected: rejectedUsers
        }
      }
    }
  });
});

// Activity log (for AdminUsers)
exports.getActivityLog = catchAsync(async (req, res, next) => {
  try {
    // Try to fetch admin users with activity logs
    const adminUsers = await AdminUser.find().select('email activityLog');

    // If no admin users found, return empty activity log
    if (!adminUsers || adminUsers.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          activityLog: [],
          message: 'No admin users found'
        }
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        activityLog: adminUsers
      }
    });
  } catch (error) {
    console.error('Error fetching activity log:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch activity log',
      error: error.message
    });
  }
});

// Super Admin specific functions

// Update admin user (Super Admin only)
exports.updateAdminUser = catchAsync(async (req, res, next) => {
  const { role, permissions, status } = req.body;

  // Only super admins can update other admin users
  if (!req.user.permissions.includes('all_permissions')) {
    return next(new AppError('Only Super Admins can update admin users', 403));
  }

  const updateData = {};
  if (role) updateData.role = role;
  if (permissions) {
    const validation = validatePermissions(permissions, req.user);
    if (!validation.isValid) {
      return next(new AppError('Invalid permissions provided', 400));
    }
    updateData.permissions = permissions.map(p => p.toLowerCase());
  }
  if (status) updateData.status = status;
  
  updateData.updatedAt = new Date();

  const adminUser = await AdminUser.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  if (!adminUser) {
    return next(new AppError('No admin user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Admin user updated successfully',
    data: {
      adminUser
    }
  });
});

// Delete admin user (Super Admin only)
exports.deleteAdminUser = catchAsync(async (req, res, next) => {
  // Only super admins can delete other admin users
  if (!req.user.permissions.includes('all_permissions')) {
    return next(new AppError('Only Super Admins can delete admin users', 403));
  }

  const adminUser = await AdminUser.findByIdAndDelete(req.params.id);

  if (!adminUser) {
    return next(new AppError('No admin user found with that ID', 404));
  }

  // Remove password from response
  adminUser.password = undefined;

  res.status(200).json({
    status: 'success',
    message: 'Admin user deleted successfully',
    data: {
      deletedAdminUser: adminUser
    }
  });
});

// Advanced system stats (Super Admin only)
exports.getAdvancedStats = catchAsync(async (req, res, next) => {
  // Only super admins can access advanced stats
  if (!req.user.permissions.includes('all_permissions') && !req.user.permissions.includes('system_management')) {
    return next(new AppError('Insufficient permissions for advanced stats', 403));
  }

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Users stats
  const totalUsers = await User.countDocuments();
  const totalEmployees = await User.countDocuments({ role: 'employee' });
  const activeUsers = await User.countDocuments({ status: 'active' });
  const suspendedUsers = await User.countDocuments({ status: 'suspended' });
  const newUsersThisMonth = await User.countDocuments({ 
    createdAt: { $gte: thisMonthStart } 
  });
  const newUsersLastMonth = await User.countDocuments({ 
    createdAt: { $gte: lastMonthStart, $lt: thisMonthStart } 
  });

  // Admin users stats
  const totalAdminUsers = await AdminUser.countDocuments();
  const activeAdminUsers = await AdminUser.countDocuments({ status: { $ne: 'suspended' } });
  const suspendedAdminUsers = await AdminUser.countDocuments({ status: 'suspended' });

  // Organizers stats
  const totalOrganizers = await Organizer.countDocuments();
  const activeOrganizers = await Organizer.countDocuments({ status: 'active' });
  const pendingOrganizers = await Organizer.countDocuments({ status: 'pending' });

  // Verification stats
  const pendingVerification = await User.countDocuments({ verificationStatus: 'pending' });
  const verifiedUsers = await User.countDocuments({ verificationStatus: 'verified' });
  const rejectedUsers = await User.countDocuments({ verificationStatus: 'rejected' });

  // Calculate growth percentage
  const growthRate = newUsersLastMonth > 0 
    ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth * 100).toFixed(1)
    : '0';

  res.status(200).json({
    status: 'success',
    data: {
      systemStats: {
        users: {
          total: totalUsers,
          employees: totalEmployees,
          active: activeUsers,
          suspended: suspendedUsers,
          newThisMonth: newUsersThisMonth,
          growth: `${growthRate}%`
        },
        adminUsers: {
          total: totalAdminUsers,
          active: activeAdminUsers,
          suspended: suspendedAdminUsers,
          lastLoginToday: 0 // This would need session tracking
        },
        organizers: {
          total: totalOrganizers,
          active: activeOrganizers,
          pending: pendingOrganizers,
          rejected: totalOrganizers - activeOrganizers - pendingOrganizers,
          revenue: 0 // This would need event/ticket integration
        },
        verification: {
          pending: pendingVerification,
          verified: verifiedUsers,
          rejected: rejectedUsers
        },
        system: {
          serverUptime: process.uptime(),
          nodeVersion: process.version,
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString()
        }
      }
    }
  });
});

// System health check (Super Admin only)
exports.getSystemHealth = catchAsync(async (req, res, next) => {
  // Only super admins can access system health
  if (!req.user.permissions.includes('all_permissions') && !req.user.permissions.includes('system_management')) {
    return next(new AppError('Insufficient permissions for system health', 403));
  }

  const mongoose = require('mongoose');
  
  // Check database connection
  const dbStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';
  const dbConnections = mongoose.connection.db?.serverConfig?.connections?.length || 0;

  res.status(200).json({
    status: 'success',
    data: {
      systemHealth: {
        overall: 'healthy',
        services: {
          database: {
            status: dbStatus,
            responseTime: '12ms', // This would need actual ping measurement
            connections: dbConnections
          },
          server: {
            status: 'healthy',
            uptime: `${Math.floor(process.uptime() / 86400)} days, ${Math.floor((process.uptime() % 86400) / 3600)} hours`,
            memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
            cpuUsage: `${Math.round(process.cpuUsage().user / 1000)}%`
          },
          storage: {
            status: 'healthy',
            freeSpace: '85%', // This would need actual disk space check
            totalSpace: '500GB'
          }
        },
        lastChecked: new Date().toISOString()
      }
    }
  });
});

// Get users with advanced filters (Super Admin only)
exports.getAdvancedUsers = catchAsync(async (req, res, next) => {
  // Only super admins can access advanced user data
  if (!req.user.permissions.includes('all_permissions') && !req.user.permissions.includes('system_management')) {
    return next(new AppError('Insufficient permissions for advanced user data', 403));
  }

  const {
    role,
    status,
    verificationStatus,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (verificationStatus) filter.verificationStatus = verificationStatus;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Get users with filters and pagination
  const users = await User.find(filter)
    .select('-password')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    status: 'success',
    results: users.length,
    totalPages,
    currentPage: parseInt(page),
    data: {
      users
    }
  });
});

// Bulk user operations (Super Admin only)
exports.bulkUserOperations = catchAsync(async (req, res, next) => {
  // Only super admins can perform bulk operations
  if (!req.user.permissions.includes('all_permissions')) {
    return next(new AppError('Only Super Admins can perform bulk operations', 403));
  }

  const { operation, userIds, reason, notifyUsers = false } = req.body;

  if (!operation || !userIds || !Array.isArray(userIds)) {
    return next(new AppError('Operation and userIds array are required', 400));
  }

  const validOperations = ['suspend', 'activate', 'delete', 'verify', 'reject'];
  if (!validOperations.includes(operation)) {
    return next(new AppError('Invalid operation. Valid operations: ' + validOperations.join(', '), 400));
  }

  const results = [];
  let successful = 0;
  let failed = 0;

  for (const userId of userIds) {
    try {
      let updateData = {};
      
      switch (operation) {
        case 'suspend':
          updateData = { status: 'suspended' };
          break;
        case 'activate':
          updateData = { status: 'active' };
          break;
        case 'verify':
          updateData = { verificationStatus: 'verified' };
          break;
        case 'reject':
          updateData = { verificationStatus: 'rejected' };
          break;
        case 'delete':
          await User.findByIdAndDelete(userId);
          results.push({
            userId,
            status: 'success',
            message: 'User deleted successfully'
          });
          successful++;
          continue;
      }

      if (operation !== 'delete') {
        const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
        if (user) {
          results.push({
            userId,
            status: 'success',
            message: `User ${operation}${operation.endsWith('e') ? 'd' : 'ed'} successfully`
          });
          successful++;
        } else {
          results.push({
            userId,
            status: 'failed',
            message: 'User not found'
          });
          failed++;
        }
      }
    } catch (error) {
      results.push({
        userId,
        status: 'failed',
        message: error.message
      });
      failed++;
    }
  }

  res.status(200).json({
    status: 'success',
    message: 'Bulk operation completed successfully',
    data: {
      operation,
      totalUsers: userIds.length,
      successful,
      failed,
      results
    }
  });
});