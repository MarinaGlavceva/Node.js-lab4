
#  Лабораторная работа №4

## Тема: Обработка ошибок, валидация и логгирование в приложениях на Node.js (Express)

###  Цель работы

Целью моей лабораторной работы является изучение методов **обработки ошибок**, **валидации данных** и **логгирования** в приложениях, написанных на **Node.js с использованием Express**.
Также я интегрировала систему **Sentry** для отслеживания ошибок в реальном времени.


##  Шаг 1. Реализация централизованного обработчика ошибок

Первым делом я создала централизованный обработчик ошибок, который отвечает за перехват и обработку всех исключений, возникающих в приложении.

###  Файл: `middleware/errorHandler.js`

```js
const { ValidationError, AppError } = require('./errors');

function errorHandler(err, req, res, next) {
  console.error(' Ошибка:', err);

  // Если это ошибка моего типа (AppError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Если это ошибка валидации
  if (err.array) {
    return res.status(400).json({
      status: 'error',
      message: 'Ошибка валидации данных',
      errors: err.array(),
    });
  }

  // Неизвестная ошибка
  return res.status(500).json({
    status: 'error',
    message: 'Внутренняя ошибка сервера',
  });
}

module.exports = { errorHandler };
```

---

###  Также я добавила обёртку для async-функций:

Это позволяет не терять ошибки в асинхронных маршрутах.
 `middleware/asyncHandler.js`

```js
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

Теперь любой маршрут, использующий `async`, я оборачиваю через:

```js
const asyncHandler = require('../middleware/asyncHandler');

router.get('/', asyncHandler(async (req, res) => {
  const data = await Category.findAll();
  res.json(data);
}));
```

 Таким образом, все ошибки автоматически передаются в мой `errorHandler`, и приложение не падает.


##  Шаг 2. Валидация данных

Для проверки данных, которые приходят от клиента, я использовала библиотеку **express-validator**.
Я добавила валидацию при создании и обновлении категорий, чтобы убедиться, что данные корректны.

###  Пример: `routes/categoryRoutes.js`

```js
const { body, validationResult } = require('express-validator');
const asyncHandler = require('../middleware/asyncHandler');
const categoryController = require('../controllers/categoryController');

router.post(
  '/',
  [
    body('name')
      .notEmpty().withMessage('Название категории обязательно')
      .isLength({ min: 2, max: 100 }).withMessage('Название категории должно быть от 2 до 100 символов'),
  ],
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(errors);
    }
    await categoryController.create(req, res);
  })
);
```

###  Пример проверки в Postman:

Если я отправляю пустое поле `name`, ответ возвращается:

```json
{
  "status": "error",
  "message": "Ошибка валидации данных",
  "errors": [
    { "field": "name", "message": "Название категории обязательно" },
    { "field": "name", "message": "Название категории должно быть от 2 до 100 символов" }
  ]
}
```

 Это доказывает, что валидация работает, и ошибки корректно возвращаются в формате JSON.
<img width="818" height="714" alt="image" src="https://github.com/user-attachments/assets/7a4a6524-4d06-456f-82bd-80795edc7a2b" />
<img width="820" height="870" alt="image" src="https://github.com/user-attachments/assets/4efc7412-81cd-4c7f-8134-b3d431b542ce" />

---

##  Шаг 3. Логгирование с помощью Winston

На этом шаге я добавила систему логгирования, чтобы фиксировать:

* все запросы, которые приходят на сервер;
* ошибки, возникающие во время выполнения;
* внутренние события.

 Файл `middleware/logger.js`

```js
const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}`)
  ),
  transports: [
    new transports.Console(),
    new transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '7d'
    })
  ]
});

module.exports = logger;
```
 Теперь каждый запрос логируется:

```js
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});
```

И ошибки тоже:

```js
logger.error(`Ошибка: ${err.message}`);
```

 Логи автоматически сохраняются в папке `/logs` с ежедневной ротацией.
<img width="1280" height="267" alt="image" src="https://github.com/user-attachments/assets/a4540434-1572-40cb-9107-983d2917f715" />

---

##  Шаг 4. Интеграция Sentry

Чтобы реализовать **отслеживание ошибок в реальном времени**, я добавила **Sentry**.
Этот сервис автоматически получает информацию о любых ошибках в приложении.

 Фрагмент `app.js`:

```js
require('dotenv').config();
const Sentry = require('@sentry/node');
const express = require('express');
const app = express();

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
```

В конце файла:

```js
app.use(Sentry.Handlers.errorHandler());
app.use(errorHandler);
```

Теперь, если я открываю маршрут `/error-test`, где я специально генерирую ошибку:

```js
app.get('/error-test', (req, res) => {
  throw new Error('Тестовая ошибка!');
});
```

— она появляется в моём **Sentry dashboard** (панели мониторинга).
Я вижу тип ошибки, файл, строку и даже запрос, который вызвал сбой.

 При этом **ошибки валидации** не отправляются в Sentry, чтобы не перегружать отчёты.


##  Контрольные вопросы

### 1️ Какие преимущества централизованной обработки ошибок в Express?

Централизованный обработчик ошибок позволяет:

* хранить всю логику обработки в одном месте;
* возвращать единообразные ответы клиенту;
* облегчает отладку и сопровождение кода;
* предотвращает “падение” приложения при неожиданных исключениях.

### 2️ Какие категории логов я решила вести и почему?

Я решила логировать:

* **информационные события** (успешные запросы и маршруты);
* **ошибки уровня приложения** (ошибки API, базы данных);
* **ошибки валидации** (но без отправки в Sentry);

Так я могу анализировать поведение приложения и отслеживать сбои в работе без постоянного мониторинга вручную.

### 3️ Какие существуют подходы к валидации данных в Express и какой я использовала?

Существует несколько способов:

1. Ручная проверка данных через `if` и регулярные выражения;
2. Использование библиотеки **Joi**;
3. Использование **express-validator** (я выбрала именно этот способ).

Библиотека `express-validator` позволяет гибко определять правила проверки и возвращать детальные сообщения об ошибках.


##  Вывод

В ходе данной лабораторной работы я реализовала:

* централизованный обработчик ошибок;
* корректную обработку асинхронных функций;
* систему валидации входных данных;
* логгирование запросов и ошибок с помощью Winston;
* интеграцию Sentry для мониторинга в реальном времени.
