const FaceImage = require('./faceImage.model');
const AppError = require('../../shared/utils/appError');
const catchAsync = require('../../shared/utils/catchAsync');

exports.getAllFaceImages = catchAsync(async (req, res, next) => {
  const faceImages = await FaceImage.find();

  res.status(200).json({
    status: 'success',
    results: faceImages.length,
    data: {
      faceImages
    }
  });
});

exports.getFaceImage = catchAsync(async (req, res, next) => {
  const faceImage = await FaceImage.findById(req.params.id);

  if (!faceImage) {
    return next(new AppError('No face image found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      faceImage
    }
  });
});

exports.createFaceImage = catchAsync(async (req, res, next) => {
  const { rekognitionId, fullName, imageUrl, encodingData, confidence } = req.body;
  
  // Validate required fields
  if (!rekognitionId) {
    return next(new AppError('Rekognition ID is required.', 400));
  }
  
  if (!fullName || fullName.trim().length < 2) {
    return next(new AppError('Full name is required and must be at least 2 characters long.', 400));
  }
  
  // Check if rekognition ID already exists
  const existingFaceImage = await FaceImage.findOne({ rekognitionId });
  if (existingFaceImage) {
    return next(new AppError('Face image with this Rekognition ID already exists.', 400));
  }
  
  const faceImage = await FaceImage.create({
    rekognitionId,
    fullName: fullName.trim(),
    imageUrl,
    encodingData,
    confidence
  });

  res.status(201).json({
    status: 'success',
    message: 'Face image created successfully',
    data: {
      faceImage
    }
  });
});

exports.updateFaceImage = catchAsync(async (req, res, next) => {
  const faceImage = await FaceImage.findByIdAndUpdate(
    req.params.id, 
    req.body, 
    {
      new: true,
      runValidators: true
    }
  );

  if (!faceImage) {
    return next(new AppError('No face image found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      faceImage
    }
  });
});

exports.deleteFaceImage = catchAsync(async (req, res, next) => {
  const faceImage = await FaceImage.findByIdAndDelete(req.params.id);

  if (!faceImage) {
    return next(new AppError('No face image found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.findByRekognitionId = catchAsync(async (req, res, next) => {
  const { rekognitionId } = req.params;
  
  const faceImage = await FaceImage.findOne({ rekognitionId });

  if (!faceImage) {
    return next(new AppError('No face image found with that Rekognition ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      faceImage
    }
  });
});

exports.searchByName = catchAsync(async (req, res, next) => {
  const { name } = req.query;
  
  if (!name) {
    return next(new AppError('Name query parameter is required', 400));
  }
  
  const faceImages = await FaceImage.find({
    fullName: { $regex: name, $options: 'i' }
  });

  res.status(200).json({
    status: 'success',
    results: faceImages.length,
    data: {
      faceImages
    }
  });
});
