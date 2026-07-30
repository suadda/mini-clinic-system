const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

// Verifies the Bearer token and puts the payload on req.user.
const authenticate = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, 'Token tidak ditemukan'));
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return next(new ApiError(401, 'Token tidak valid atau kedaluwarsa'));
  }
};

// Restricts a route to the given roles.
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Anda tidak memiliki akses ke resource ini'));
  }
  next();
};

module.exports = { authenticate, authorize };
