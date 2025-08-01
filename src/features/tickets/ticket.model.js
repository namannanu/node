const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  event: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  ticketId: { type: String, required: true, unique: true },
  seatNumber: { type: String },
  price: { type: Number, required: true },
  purchaseDate: { type: Date, default: Date.now },
  checkInTime: { type: Date },
  status: { 
    type: String, 
    enum: ['active', 'checked-in', 'cancelled', 'refunded'], 
    default: 'active' 
  },
  faceVerified: { type: Boolean, default: false }
});

// Update the updatedAt field before saving
ticketSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Check if model already exists before defining it
const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;