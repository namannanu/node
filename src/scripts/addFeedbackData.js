const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({
  path: path.join(__dirname, '..', 'config', 'config.env'),
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Import models
const User = require('../features/auth/auth.model');
const Event = require('../features/events/event.model');

// Feedback Model
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

const Feedback = mongoose.model('Feedback', feedbackSchema);

// Sample feedback data
const sampleFeedbackData = [
  {
    user: "688a258082adb7d2675cd4c6", // First user from dummy data
    event: "688a258082adb7d2675cd4d4", // First event from dummy data
    feedbackEntries: [
      {
        rating: 5,
        category: "overall",
        subject: "Amazing Experience!",
        message: "The festival was absolutely incredible. The face verification made entry so smooth and quick. The sound quality was fantastic and the artists were amazing. Will definitely attend next year!",
        status: "new",
        helpful: 12,
        notHelpful: 1
      },
      {
        rating: 4,
        category: "security",
        subject: "Great Security System",
        message: "The facial recognition entry was really impressive. No more worrying about losing tickets! However, there was a bit of queue during peak hours. Overall great security measures.",
        status: "reviewed",
        helpful: 8,
        notHelpful: 0
      }
    ]
  },
  {
    user: "688a258082adb7d2675cd4c7", // Second user
    event: "688a258082adb7d2675cd4d5", // Second event
    feedbackEntries: [
      {
        rating: 4,
        category: "overall",
        subject: "Good Event, Minor Issues",
        message: "Overall a great event! The technology was impressive, but there were some connectivity issues during registration. Staff was very helpful though.",
        status: "new",
        helpful: 5,
        notHelpful: 2
      },
      {
        rating: 3,
        category: "technical",
        subject: "Some Technical Glitches",
        message: "The app had some issues during check-in. The face recognition worked well but the app crashed a few times. Needs improvement.",
        status: "new",
        helpful: 3,
        notHelpful: 1
      }
    ]
  },
  {
    user: "688a258082adb7d2675cd4c8", // Third user
    event: "688a258082adb7d2675cd4d6", // Third event
    feedbackEntries: [
      {
        rating: 5,
        category: "support",
        subject: "Excellent Customer Support",
        message: "Had an issue with my ticket and the support team was incredibly helpful. They resolved everything quickly and professionally.",
        status: "reviewed",
        helpful: 15,
        notHelpful: 0
      }
    ]
  }
];

const addFeedbackData = async () => {
  try {
    await connectDB();
    
    console.log('🗑️  Clearing existing feedback data...');
    await Feedback.deleteMany({});
    console.log('✅ Existing feedback data cleared');
    
    console.log('📝 Creating feedback data...');
    const createdFeedback = await Feedback.create(sampleFeedbackData);
    console.log(`✅ Created ${createdFeedback.length} feedback documents`);
    
    // Populate and display the created feedback
    const populatedFeedback = await Feedback.find()
      .populate('user', 'fullName email')
      .populate('event', 'title date');
    
    console.log('📊 Created feedback data:');
    populatedFeedback.forEach((feedback, index) => {
      console.log(`\n${index + 1}. User: ${feedback.user?.fullName || 'Unknown'}`);
      console.log(`   Event: ${feedback.event?.title || 'Unknown'}`);
      console.log(`   Entries: ${feedback.feedbackEntries.length}`);
      feedback.feedbackEntries.forEach((entry, entryIndex) => {
        console.log(`   - Entry ${entryIndex + 1}: ${entry.category} (${entry.rating}/5) - ${entry.subject}`);
      });
    });
    
    console.log('\n✅ Feedback data creation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating feedback data:', error);
    process.exit(1);
  }
};

// Run the script
addFeedbackData(); 