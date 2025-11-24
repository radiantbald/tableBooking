require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
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

// Rate limiting для защиты от брутфорса
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: { success: false, error: 'Слишком много запросов. Пожалуйста, подождите 15 минут перед повторной попыткой.' },
  standardHeaders: true, // Включает заголовки RateLimit-* и Retry-After
  legacyHeaders: false,
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' })); // Ограничение размера тела запроса
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

