// Wraps an async controller so any rejected promise is forwarded to
// the centralized error handler instead of crashing the process.
module.exports = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
