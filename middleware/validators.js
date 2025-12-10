const { body, validationResult } = require('express-validator');

// 🔹 Проверка ошибок (общая функция)
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Ошибка валидации данных',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// 🔹 Валидация для категорий
const categoryValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Название категории обязательно')
    .isLength({ min: 2, max: 100 }).withMessage('Название категории должно быть от 2 до 100 символов'),
  validate,
];

// 🔹 Валидация для задач
const todoValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Название задачи обязательно')
    .isLength({ min: 2, max: 120 }).withMessage('Название задачи должно быть от 2 до 120 символов'),
  body('category_id')
    .optional()
    .isInt().withMessage('ID категории должно быть числом'),
  validate,
];

module.exports = { categoryValidation, todoValidation };
