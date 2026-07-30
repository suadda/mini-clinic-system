// Custom error carrying an HTTP status code and a field->message map.
class ApiError extends Error {
  constructor(statusCode, message, errors = {}) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
module.exports = ApiError;
