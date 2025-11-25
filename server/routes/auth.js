const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { requestCode, verifyCode, checkAuth, logout } = require('../controllers/authController');

// Rate limiting по email (а не по IP) для запроса кода
const emailRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 запросов с одного email
  message: { success: false, error: 'Слишком много запросов. Пожалуйста, подождите 15 минут перед повторной попыткой.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  // Используем email из тела запроса как ключ для rate limiting
  keyGenerator: (req) => {
    // Извлекаем email из тела запроса
    const email = req.body?.email;
    // Если email есть, используем его, иначе fallback на IP (для безопасности)
    return email || req.ip;
  },
  // Кастомный обработчик для установки Retry-After
  handler: (req, res) => {
    const resetTime = new Date(Date.now() + 15 * 60 * 1000); // 15 минут с текущего момента
    const retryAfter = Math.ceil((resetTime.getTime() - Date.now()) / 1000);
    res.setHeader('Retry-After', retryAfter.toString());
    res.status(429).json({
      success: false,
      error: 'Слишком много запросов. Пожалуйста, подождите 15 минут перед повторной попыткой.'
    });
  },
});

// Rate limiting по email для проверки кода
const emailVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 запросов с одного email
  message: { success: false, error: 'Слишком много запросов. Пожалуйста, подождите 15 минут перед повторной попыткой.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  // Используем email из тела запроса как ключ для rate limiting
  keyGenerator: (req) => {
    // Извлекаем email из тела запроса
    const email = req.body?.email;
    // Если email есть, используем его, иначе fallback на IP (для безопасности)
    return email || req.ip;
  },
  // Кастомный обработчик для установки Retry-After
  handler: (req, res) => {
    const resetTime = new Date(Date.now() + 15 * 60 * 1000); // 15 минут с текущего момента
    const retryAfter = Math.ceil((resetTime.getTime() - Date.now()) / 1000);
    res.setHeader('Retry-After', retryAfter.toString());
    res.status(429).json({
      success: false,
      error: 'Слишком много запросов. Пожалуйста, подождите 15 минут перед повторной попыткой.'
    });
  },
});

router.post('/request-code', emailRequestLimiter, requestCode);
router.post('/verify-code', emailVerifyLimiter, verifyCode);
router.get('/check', checkAuth);
router.post('/logout', logout);

module.exports = router;

