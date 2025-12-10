require('dotenv').config();
const Sentry = require('@sentry/node');
const express = require('express');
const bodyParser = require('body-parser');
const { errorHandler } = require('./middleware/errorHandler');
const categoryRoutes = require('./routes/categoryRoutes');
const todoRoutes = require('./routes/todoRoutes');
const authRoutes = require('./routes/authRoutes');
const { swaggerUi, swaggerSpec } = require('./swagger');
const logger = require('./middleware/logger');

// === ИНИЦИАЛИЗАЦИЯ SENTRY ===
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

const app = express();

// === SENTRY MIDDLEWARE (новый синтаксис для @sentry/express) ===
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// === ЛОГИРОВАНИЕ ЗАПРОСОВ ===
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// === ОБЩИЕ MIDDLEWARE ===
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// === SWAGGER ===
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// === ROUTES ===
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/todos', todoRoutes);

// === ТЕСТОВЫЙ РОУТ ===
app.get('/error-test', (req, res) => {
  throw new Error('Тестовая ошибка!');
});

// === 404 ===
app.use((req, res) => {
  res.status(404).json({ message: 'Маршрут не найден' });
});

// === ОБРАБОТЧИК ОШИБОК SENTRY ===
app.use(Sentry.Handlers.errorHandler());

// === ЦЕНТРАЛЬНЫЙ ОБРАБОТЧИК ОШИБОК ===
app.use(errorHandler);

// === СТАРТ СЕРВЕРА ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});
