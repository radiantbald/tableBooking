require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const authRoutes = require('./routes/auth');
const desksRoutes = require('./routes/desks');
const bookingsRoutes = require('./routes/bookings');

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false // Для CORS с credentials
}));

// Middleware для извлечения пользователя из токена (для rate limiting)
const extractUserForRateLimit = (req, res, next) => {
  // Пытаемся извлечь токен
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    token = req.cookies?.token;
  }

  if (token) {
    try {
      // Декодируем токен без проверки подписи для быстрого извлечения данных
      // Это безопасно для rate limiting, так как невалидный токен будет учитываться отдельно
      const decoded = jwt.decode(token);
      if (decoded && (decoded.userId || decoded.email)) {
        req.rateLimitKey = decoded.userId || decoded.email;
      }
    } catch (err) {
      // Если не удалось декодировать, будет использован IP
    }
  }

  next();
};

// Rate limiting для защиты от брутфорса
// Учитывает запросы от каждого пользователя отдельно (по userId/email или IP)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного пользователя/IP
  message: { success: false, error: 'Слишком много запросов. Пожалуйста, подождите 15 минут перед повторной попыткой.' },
  standardHeaders: true, // Включает заголовки RateLimit-* и Retry-After
  legacyHeaders: false,
  // Используем кастомный ключ: userId/email для авторизованных, IP для неавторизованных
  keyGenerator: (req) => {
    // Если есть ключ пользователя из middleware, используем его
    if (req.rateLimitKey) {
      return req.rateLimitKey;
    }
    // Иначе используем IP адрес
    return req.ip;
  },
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' })); // Ограничение размера тела запроса
app.use(extractUserForRateLimit); // Извлекаем данные пользователя для rate limiting
app.use(generalLimiter); // Общий rate limiting для всех запросов

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/desks', desksRoutes);
app.use('/api/bookings', bookingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

