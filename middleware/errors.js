// middleware/errors.js

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode || 500;
    this.status = 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Ресурс не найден') {
    super(message, 404);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Ошибка валидации данных') {
    super(message, 400);
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Ошибка базы данных') {
    super(message, 500);
  }
}

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  DatabaseError,
};
