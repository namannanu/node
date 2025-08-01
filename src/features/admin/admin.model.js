const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// AdminUsers as per your schema - separate entity
const adminUserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true,
    enum: [ 'admin', 'employee'],
    default: 'admin'
  },
  permissions: [{ type: String }],
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active'
  },
  statusReason: { type: String },
  lastActivity: { type: Date },
  lastLogin: { type: Date },
  activityLog: [{
    action: { type: String },
    timestamp: { type: Date, default: Date.now },
    details: { type: Object },
    ipAddress: { type: String },
    userAgent: { type: String }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
adminUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
adminUserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update the updatedAt field before saving
adminUserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Check if model already exists before defining it
const AdminUser = mongoose.models.AdminUser || mongoose.model('AdminUser', adminUserSchema);

module.exports = AdminUser;