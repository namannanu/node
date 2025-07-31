const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  website: { type: String },
  description: { type: String },
  contactPerson: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  joinDate: { type: Date, default: Date.now },
  lastActivity: { type: Date },
  logo: { type: String },
  totalRevenue: { type: Number, default: 0 },
  totalEvents: { type: Number, default: 0 },
  activeEvents: { type: Number, default: 0 }
});

module.exports = mongoose.model('Organizer', organizerSchema);