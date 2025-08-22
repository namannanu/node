const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true }, // Matches FullName in your schema
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, enum: ['user', 'employee'], default: 'user' }, // Removed 'admin' as it's separate
  permissions: [{ type: String }],
  avatar: { type: String },
  faceId: { 
    type: String,
    ref: 'FaceImage'
  },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'], 
    default: 'pending' 
  },
  aadhaarPhoto: { type: String },
  uploadedPhoto: { 
    type: String,
    description: 'S3 URL for the user\'s uploaded photo (e.g., https://nfacialimagescollections.s3.ap-south-1.amazonaws.com/public/user-id)'
  },
  lastLogin: { type: Date },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Check if model already exists before defining it
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;