const mongoose = require('mongoose');

const userEventRegistrationSchema = new mongoose.Schema({
  registrationId: {
    type: String,
    default: function() {
      return this._id.toString();
    }
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  checkInTime: {
    type: Date,
    default: null
  },
  waitingStatus: {
    type: String,
    enum: ['queued', 'processing', 'complete'],
    default: 'queued'
  },
  faceVerificationStatus: {
    type: String,
    enum: ['pending', 'processing', 'success', 'failed'],
    default: 'pending'
  },
  ticketAvailabilityStatus: {
    type: String,
    enum: ['pending', 'available', 'unavailable'],
    default: 'pending'
  },
  verificationAttempts: {
    type: Number,
    default: 0
  },
  lastVerificationAttempt: {
    type: Date,
    default: null
  },
  ticketIssued: {
    type: Boolean,
    default: false
  },
  ticketIssuedDate: {
    type: Date,
    default: null
  },
  adminBooked: {
    type: Boolean,
    default: false
  },
  adminOverrideReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
userEventRegistrationSchema.index({ eventId: 1 });
userEventRegistrationSchema.index({ userId: 1 });
userEventRegistrationSchema.index({ status: 1 });
userEventRegistrationSchema.index({ faceVerificationStatus: 1 });
userEventRegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true }); // Prevent duplicate registrations

// Update the updatedAt field before saving
userEventRegistrationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Check if model already exists before defining it
const UserEventRegistration = mongoose.models.UserEventRegistration || mongoose.model('UserEventRegistration', userEventRegistrationSchema);

module.exports = UserEventRegistration;
