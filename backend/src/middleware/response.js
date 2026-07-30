// Attaches helpers so every controller returns the standard response shape.
module.exports = (req, res, next) => {
  res.sendSuccess = (data = {}, message = 'Success', statusCode = 200) =>
    res.status(statusCode).json({ success: true, message, data });

  res.sendError = (errors = {}, message = 'Error', statusCode = 400) =>
    res.status(statusCode).json({ success: false, message, errors });

  next();
};
