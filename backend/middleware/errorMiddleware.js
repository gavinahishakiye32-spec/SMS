const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || 'Internal server error. Please try again.';

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    const msgs = Object.values(err.errors || {}).map((e) => e.message).join(', ');
    message = msgs || 'Validation failed';
  }

  if (err.code === 11000) {
    statusCode = 409;
    const keyValue = err.keyValue ? Object.keys(err.keyValue).map(k => `${k}: "${err.keyValue[k]}"`).join(', ') : '';
    message = keyValue ? `Duplicate value: ${keyValue} already exists` : 'Duplicate field value';
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
