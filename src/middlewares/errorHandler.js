const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('Error:', err);

  let statusCode = error.statusCode || 500;
  let message = error.message || 'Server Error';
  let data = null;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    message = 'Resource not found';
    statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    message = 'Duplicate field value entered';
    statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(val => val.message).join(', ');
    statusCode = 400;
  }

  // Joi validation error
  if (err.isJoi) {
    message = err.details.map(detail => detail.message).join(', ');
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    code: statusCode,
    message: message,
    data: data,
    error: message // Keeping error field for backward compatibility/debugging if needed, or I can remove it.
    // The prompt asked for success, code, message, data.
  });
};

module.exports = errorHandler;