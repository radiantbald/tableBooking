const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { requestCode, verifyCode, checkAuth, logout } = require('../controllers/authController');

// Строгий rate limiting для аутентификации
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 запросов с одного IP
  message: { success: false, error: 'Слишком много запросов. Пожалуйста, подождите 15 минут перед повторной попыткой.' },
  standardHeaders: true, // Включает заголовки RateLimit-* и Retry-After
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Считаем все запросы, включая успешные
});

router.post('/request-code', authLimiter, requestCode);
router.post('/verify-code', authLimiter, verifyCode);
router.get('/check', checkAuth);
router.post('/logout', logout);

module.exports = router;

