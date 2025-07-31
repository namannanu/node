const mongoose = require('mongoose');

const feedbackEntrySchema = new mongoose.Schema({
  rating: { type: Number, required: true, min: 1, max: 5 },
  category: { 
    type: String, 
    enum: ['overall', 'security', 'technical', 'support'],
    required: true 
  },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['new', 'reviewed'], default: 'new' },
  helpful: { type: Number, default: 0 },
  notHelpful: { type: Number, default: 0 }
});

const feedbackSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  event: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true 
  },
  feedbackEntries: [feedbackEntrySchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Ensure one feedback document per user-event combination
feedbackSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);