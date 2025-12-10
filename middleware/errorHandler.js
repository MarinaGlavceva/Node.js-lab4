const { ValidationError, AppError } = require('./errors');
const logger = require('./logger');

function errorHandler(err, req, res, next) {
  logger.error(`${req.method} ${req.url} - ${err.message}`);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  if (err.array) {
    return res.status(400).json({
      status: 'error',
      message: 'Ошибка валидации данных',
      errors: err.array(),
    });
  }

  return res.status(500).json({
    status: 'error',
    message: 'Внутренняя ошибка сервера',
  });
}

module.exports = { errorHandler };
