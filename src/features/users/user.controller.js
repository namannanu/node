const User = require('../auth/auth.model');
const AppError = require('../../shared/utils/appError');
const catchAsync = require('../../shared/utils/catchAsync');
const { rekognition } = require('../../config/aws');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find().select('-password');

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select('-password');

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.verifyUserFace = catchAsync(async (req, res, next) => {
  const { userId, uploadedPhoto, aadhaarPhoto } = req.body;

  const params = {
    SourceImage: {
      S3Object: {
        Bucket: process.env.AWS_S3_BUCKET,
        Name: uploadedPhoto
      }
    },
    TargetImage: {
      S3Object: {
        Bucket: process.env.AWS_S3_BUCKET,
        Name: aadhaarPhoto
      }
    },
    SimilarityThreshold: 90
  };

  try {
    const data = await rekognition.compareFaces(params).promise();
    
    if (data.FaceMatches && data.FaceMatches.length > 0) {
      const similarity = data.FaceMatches[0].Similarity;
      
      if (similarity >= 90) {
        const user = await User.findByIdAndUpdate(
          userId,
          { verificationStatus: 'verified', faceId: data.FaceMatches[0].Face.FaceId },
          { new: true }
        );

        return res.status(200).json({
          status: 'success',
          data: {
            user,
            similarity
          }
        });
      }
    }

    res.status(200).json({
      status: 'fail',
      message: 'Faces do not match',
      data: {
        similarity: data.FaceMatches ? data.FaceMatches[0].Similarity : 0
      }
    });
  } catch (err) {
    return next(new AppError('Error verifying face: ' + err.message, 500));
  }
});

exports.getMyProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-password');

  res.status(200).json({
    status: 'success',
    data: {
      user: user,
      yourPermissions: user.permissions || [],
      yourRole: user.role
    }
  });
});