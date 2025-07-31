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

module.exports = mongoose.model('Ticket', ticketSchema);