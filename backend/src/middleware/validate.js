const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Collects express-validator results into the standard errors object.
module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = {};
  for (const e of result.array()) {
    if (!errors[e.path]) errors[e.path] = e.msg;
  }
  return next(new ApiError(422, 'Validation Error', errors));
};
