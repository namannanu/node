const Ticket = require('./ticket.model');
const AppError = require('../../shared/utils/appError');
const catchAsync = require('../../shared/utils/catchAsync');

exports.getAllTickets = catchAsync(async (req, res, next) => {
  const tickets = await Ticket.find().populate('event user');

  res.status(200).json({
    status: 'success',
    results: tickets.length,
    data: {
      tickets
    }
  });
});

exports.getTicket = catchAsync(async (req, res, next) => {
  const ticket = await Ticket.findById(req.params.id).populate('event user');

  if (!ticket) {
    return next(new AppError('No ticket found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      ticket
    }
  });
});

exports.createTicket = catchAsync(async (req, res, next) => {
  const newTicket = await Ticket.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      ticket: newTicket
    }
  });
});

exports.updateTicket = catchAsync(async (req, res, next) => {
  const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!ticket) {
    return next(new AppError('No ticket found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      ticket
    }
  });
});

exports.verifyTicket = catchAsync(async (req, res, next) => {
  const { ticketId, faceImage } = req.body;

  // In a real app, you would verify the face against the user's stored face
  const ticket = await Ticket.findByIdAndUpdate(
    ticketId,
    { status: 'checked-in', faceVerified: true, checkInTime: Date.now() },
    { new: true }
  );

  if (!ticket) {
    return next(new AppError('No ticket found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      ticket
    }
  });
});