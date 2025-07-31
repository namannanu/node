const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  location: { type: String, required: true },
  organizer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organizer', 
    required: true 
  },
  totalTickets: { type: Number, required: true },
  ticketsSold: { type: Number, default: 0 },
  ticketPrice: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['upcoming', 'active', 'completed', 'cancelled'], 
    default: 'upcoming' 
  },
  coverImage: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

eventSchema.virtual('revenue').get(function() {
  return this.ticketsSold * this.ticketPrice;
});

module.exports = mongoose.model('Event', eventSchema);