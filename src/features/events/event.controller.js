const Event = require('./event.model');
const AppError = require('../../shared/utils/appError');
const catchAsync = require('../../shared/utils/catchAsync');

exports.getAllEvents = catchAsync(async (req, res, next) => {
  const events = await Event.find().populate('organizer');

  res.status(200).json({
    status: 'success',
    results: events.length,
    data: {
      events
    }
  });
});

exports.getEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findById(req.params.id).populate('organizer');

  if (!event) {
    return next(new AppError('No event found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      event
    }
  });
});

exports.createEvent = catchAsync(async (req, res, next) => {
  console.log('📝 Creating event with data:', req.body);
  
  try {
    const newEvent = await Event.create(req.body);
    console.log('✅ Event created successfully:', newEvent);

    res.status(201).json({
      status: 'success',
      data: {
        event: newEvent
      }
    });
  } catch (error) {
    console.error('❌ Error creating event:', error);
    return next(error);
  }
});

exports.updateEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!event) {
    return next(new AppError('No event found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      event
    }
  });
});

exports.deleteEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findByIdAndDelete(req.params.id);

  if (!event) {
    return next(new AppError('No event found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getEventStats = catchAsync(async (req, res, next) => {
  console.log('🔍 GET /api/events/stats endpoint hit');
  console.log('Request headers:', req.headers);
  console.log('Request origin:', req.get('Origin'));
  
  const stats = await Event.aggregate([
    {
      $group: {
        _id: null,
        totalEvents: { $sum: 1 },
        totalRevenue: { $sum: "$revenue" },
        avgTicketPrice: { $avg: "$ticketPrice" },
        minTicketPrice: { $min: "$ticketPrice" },
        maxTicketPrice: { $max: "$ticketPrice" }
      }
    }
  ]);

  console.log('📊 Stats calculated successfully');
  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});