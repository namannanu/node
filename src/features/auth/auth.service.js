const jwt = require('jsonwebtoken');
const User = require('./auth.model');
const Admin = require('../admin/admin.model');
const { promisify } = require('util');
const { AppError } = require('../../shared/utils/');
const bcrypt = require('bcryptjs');

const signToken = (user) => {
  // sign with userId if available, otherwise fallback to _id
  return jwt.sign(
    { userId: user.userId || user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user }
  });
};




const signup = async (userObj) => {
  const newUser = await User.create(userObj);
  return newUser;
};

const login = async (email, password) => {
  // Check if email and password exist
  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  // Check if user exists in User collection first
  let user = await User.findOne({ email }).select('+password');
  
  // If not found in User collection, check Admin collection
  if (!user) {
    user = await Admin.findOne({ email }).select('+password');
  }

  // Check if user exists and password is correct
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Incorrect email or password', 401);
  }

  return user;
};




const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // Decode
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Try to find user either by userId (preferred) or _id fallback
    let currentUser = await User.findOne({ userId: decoded.userId });
    if (!currentUser) {
      currentUser = await User.findById(decoded.userId) || await Admin.findById(decoded.userId);
    }

    if (!currentUser) {
      return next(new AppError('The user belonging to this token does no longer exist.', 401));
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return next(new AppError('Invalid token. Please log in again!', 401));
  }
};






const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

module.exports = {
  signup,
  login,
  protect,
  restrictTo,
  createSendToken
};