const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true,
    unique: true,
    default: () => `user-${Math.random().toString(36).substr(2, 9)}-${Date.now().toString(36)}`
  },
  name: { type: String, required: true },
  firstname: { type: String },
  lastname: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['user', 'employee', 'admin'], default: 'user' },
  permissions: [{ type: String }],
  avatar: { type: String },
  faceId: { type: String },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'], 
    default: 'pending' 
  },
  aadhaarPhoto: { type: String },
  uploadedPhoto: { type: String },
  lastLogin: { type: Date },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  // Split name into firstname and lastname if they don't exist
  if (this.name && !this.firstname && !this.lastname) {
    const nameParts = this.name.trim().split(' ');
    this.firstname = nameParts[0] || '';
    this.lastname = nameParts.slice(1).join(' ') || '';
  }
  
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if model already exists before defining it
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;