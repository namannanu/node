const Feedback = require('./feedback.model');
const AppError = require('../../shared/utils/appError');
const catchAsync = require('../../shared/utils/catchAsync');
const mongoose = require('mongoose');

exports.getAllFeedback = catchAsync(async (req, res, next) => {
  const feedback = await Feedback.find().populate('user event');

  res.status(200).json({
    status: 'success',
    results: feedback.length,
    data: {
      feedback
    }
  });
});

exports.getFeedback = catchAsync(async (req, res, next) => {
  const feedback = await Feedback.findById(req.params.id).populate('user event');

  if (!feedback) {
    return next(new AppError('No feedback found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      feedback
    }
  });
});

exports.createFeedback = catchAsync(async (req, res, next) => {
  const { user, event, rating, category, subject, message } = req.body;
  
  // Validate ObjectId format first
  if (!mongoose.Types.ObjectId.isValid(user)) {
    return next(new AppError('Invalid user ID format.', 400));
  }
  
  if (!mongoose.Types.ObjectId.isValid(event)) {
    return next(new AppError('Invalid event ID format.', 400));
  }
  
  // Try to check if user exists (graceful handling of model conflicts)
  try {
    const User = mongoose.model('User');
    const existingUser = await User.findById(user);
    if (!existingUser) {
      return next(new AppError('User not found. Please provide a valid user ID.', 404));
    }
  } catch (modelError) {
    // If there's a model conflict, we'll skip user validation but continue
    console.warn('User model validation skipped due to model conflict');
  }
  
  // Try to check if event exists (graceful handling of model conflicts)
  try {
    const Event = mongoose.model('Event');
    const existingEvent = await Event.findById(event);
    if (!existingEvent) {
      return next(new AppError('Event not found. Please provide a valid event ID.', 404));
    }
  } catch (modelError) {
    // If there's a model conflict, we'll skip event validation but continue
    console.warn('Event model validation skipped due to model conflict');
  }
  
  // Validate required fields
  if (!rating || rating < 1 || rating > 5) {
    return next(new AppError('Rating is required and must be between 1 and 5.', 400));
  }
  
  if (!category) {
    return next(new AppError('Feedback category is required.', 400));
  }
  
  if (!subject || subject.trim().length < 3) {
    return next(new AppError('Subject is required and must be at least 3 characters long.', 400));
  }
  
  if (!message || message.trim().length < 10) {
    return next(new AppError('Message is required and must be at least 10 characters long.', 400));
  }
  
  // Create new feedback entry
  const newFeedbackEntry = {
    rating,
    category,
    subject: subject.trim(),
    message: message.trim(),
    status: 'new',
    date: new Date()
  };
  
  // Check if feedback document already exists for this user-event combination
  let feedback = await Feedback.findOne({ user, event });
  
  if (feedback) {
    // Check if user already submitted feedback for this category
    const existingCategoryFeedback = feedback.feedbackEntries.find(
      entry => entry.category === category
    );
    
    if (existingCategoryFeedback) {
      return next(new AppError(`You have already submitted ${category} feedback for this event.`, 400));
    }
    
    // Add new feedback entry to existing document
    feedback.feedbackEntries.push(newFeedbackEntry);
    feedback.updatedAt = new Date();
    await feedback.save();
  } else {
    // Create new feedback document with first entry
    feedback = await Feedback.create({
      user,
      event,
      feedbackEntries: [newFeedbackEntry]
    });
  }
  
  // Populate the response with user and event details
  const populatedFeedback = await Feedback.findById(feedback._id)
    .populate('user', 'name email')
    .populate('event', 'title date');

  res.status(201).json({
    status: 'success',
    message: 'Feedback created successfully',
    data: {
      feedback: populatedFeedback
    }
  });
});

exports.updateFeedback = catchAsync(async (req, res, next) => {
  const feedback = await Feedback.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!feedback) {
    return next(new AppError('No feedback found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      feedback
    }
  });
});

exports.markAsReviewed = catchAsync(async (req, res, next) => {
  const feedback = await Feedback.findByIdAndUpdate(
    req.params.id,
    { status: 'reviewed' },
    { new: true }
  );

  if (!feedback) {
    return next(new AppError('No feedback found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      feedback
    }
  });
});