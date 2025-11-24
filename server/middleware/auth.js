const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Сначала проверяем заголовок Authorization
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // Если токена нет в заголовке, проверяем куку
  if (!token) {
    token = req.cookies?.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Токен не предоставлен' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('ОШИБКА: JWT_SECRET не установлен в переменных окружения!');
    return res.status(500).json({ success: false, error: 'Ошибка конфигурации сервера' });
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Недействительный токен' });
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };

