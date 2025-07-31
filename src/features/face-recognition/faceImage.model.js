const mongoose = require('mongoose');

const faceImageSchema = new mongoose.Schema({
  rekognitionId: {
    type: String,
    required: [true, 'Rekognition ID is required'],
    unique: true,
    trim: true
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters long']
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required'],
    trim: true
  },
  encodingData: {
    type: mongoose.Schema.Types.Mixed, // Can store array or object
    default: null
  },
  confidence: {
    type: Number,
    min: [0, 'Confidence must be between 0 and 100'],
    max: [100, 'Confidence must be between 0 and 100'],
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    fileSize: {
      type: Number,
      default: null
    },
    dimensions: {
      width: { type: Number, default: null },
      height: { type: Number, default: null }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
faceImageSchema.index({ rekognitionId: 1 });
faceImageSchema.index({ userId: 1 });
faceImageSchema.index({ fullName: 1 });
faceImageSchema.index({ isActive: 1 });

// Virtual for display name
faceImageSchema.virtual('displayName').get(function() {
  return this.fullName;
});

// Pre-save middleware to validate image URL
faceImageSchema.pre('save', function(next) {
  if (this.imageUrl && !this.imageUrl.match(/^https?:\/\/.+/)) {
    return next(new Error('Invalid image URL format'));
  }
  next();
});

module.exports = mongoose.model('FaceImage', faceImageSchema);