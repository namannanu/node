const Organizer = require('./organizer.model');
const AppError = require('../../shared/utils/appError');
const catchAsync = require('../../shared/utils/catchAsync');

exports.getAllOrganizers = catchAsync(async (req, res, next) => {
  const organizers = await Organizer.find();

  res.status(200).json({
    status: 'success',
    results: organizers.length,
    data: {
      organizers
    }
  });
});

exports.getOrganizer = catchAsync(async (req, res, next) => {
  const organizer = await Organizer.findById(req.params.id);

  if (!organizer) {
    return next(new AppError('No organizer found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      organizer
    }
  });
});

exports.createOrganizer = catchAsync(async (req, res, next) => {
  const newOrganizer = await Organizer.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      organizer: newOrganizer
    }
  });
});

exports.updateOrganizer = catchAsync(async (req, res, next) => {
  const organizer = await Organizer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!organizer) {
    return next(new AppError('No organizer found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      organizer
    }
  });
});

exports.deleteOrganizer = catchAsync(async (req, res, next) => {
  const organizer = await Organizer.findByIdAndDelete(req.params.id);

  if (!organizer) {
    return next(new AppError('No organizer found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});